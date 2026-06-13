import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createLiveFixture,
  destroyLiveFixture,
  expectDenied,
  type LiveFixture,
} from "./supabase-live";

let fixture: LiveFixture;

describe("Milestone 5 live Supabase RLS launch-blocker tests", () => {
  beforeAll(async () => {
    fixture = await createLiveFixture();
  });

  afterAll(async () => {
    if (fixture) {
      await destroyLiveFixture(fixture);
    }
  });

  it("connects only to local Supabase", () => {
    expect(fixture.env.url).toMatch(/^http:\/\/(127\.0\.0\.1|localhost|\[::1\]):54321$/);
  });

  it("blocks Clinic A from reading every seeded Clinic B tenant table without relying on app filters", async () => {
    for (const [table, row] of Object.entries(fixture.clinicB.rows)) {
      const result = await fixture.users.ownerA.client
        .from(table)
        .select("*")
        .eq(row.column, row.value);

      expect(result.error, `${table} should not error while hiding cross-tenant rows`).toBeNull();
      expect(result.data, `${table} leaked a Clinic B row to Clinic A`).toEqual([]);
    }
  });

  it("allows active members to read their own clinic rows", async () => {
    const result = await fixture.users.ownerA.client
      .from("patients")
      .select("id")
      .eq("id", fixture.clinicA.patientId);

    expect(result.error).toBeNull();
    expect(result.data).toEqual([{ id: fixture.clinicA.patientId }]);
  });

  it("blocks Clinic B from reading Clinic A private data", async () => {
    const result = await fixture.users.ownerB.client
      .from("patients")
      .select("id")
      .eq("id", fixture.clinicA.patientId);

    expect(result.error).toBeNull();
    expect(result.data).toEqual([]);
  });

  it("blocks suspended, removed, and no-membership users from clinic-owned rows", async () => {
    for (const client of [
      fixture.users.suspendedA.client,
      fixture.users.removedA.client,
      fixture.users.noMembership.client,
    ]) {
      const result = await client.from("patients").select("id").eq("id", fixture.clinicA.patientId);

      expect(result.error).toBeNull();
      expect(result.data).toEqual([]);
    }
  });

  it("blocks anonymous users from private clinic reads and writes", async () => {
    const read = await fixture.anon.from("patients").select("id");
    const write = await fixture.anon.from("patients").insert({
      clinic_id: fixture.clinicA.id,
      full_name: "Anon Patient",
      phone: "+962790000090",
    });
    const publicBooking = await fixture.anon.from("public_booking_requests").insert({
      clinic_id: fixture.clinicA.id,
      patient_name: "Anon Booking",
      patient_phone: "+962790000091",
      requested_at: "2031-02-01T09:00:00Z",
    });

    expectDenied(read);
    expect(write.error).toBeTruthy();
    expect(publicBooking.error).toBeTruthy();
  });

  it("blocks cross-tenant writes and cross-clinic foreign key references", async () => {
    const insertOtherClinic = await fixture.users.ownerA.client.from("patients").insert({
      clinic_id: fixture.clinicB.id,
      full_name: "Cross Tenant",
      phone: "+962790000092",
    });
    const updateOtherClinic = await fixture.users.ownerA.client
      .from("patients")
      .update({ notes: "blocked" })
      .eq("id", fixture.clinicB.patientId)
      .select("id");
    const crossFkAppointment = await fixture.users.ownerA.client.from("appointments").insert({
      clinic_id: fixture.clinicA.id,
      patient_id: fixture.clinicB.patientId,
      doctor_member_id: fixture.clinicA.doctorMemberId,
      starts_at: "2031-01-01T11:00:00Z",
      ends_at: "2031-01-01T11:30:00Z",
      status: "booked",
    });

    expect(insertOtherClinic.error).toBeTruthy();
    expectDenied(updateOtherClinic);
    expect(crossFkAppointment.error).toBeTruthy();
  });

  it("enforces permission-based writes for owner and manager staff lifecycle", async () => {
    const ownerInsert = await fixture.users.ownerA.client
      .from("clinic_members")
      .insert({
        clinic_id: fixture.clinicA.id,
        user_id: fixture.users.staffCandidate.appUserId,
        role: "assistant",
      })
      .select("id")
      .single();

    expect(ownerInsert.error).toBeNull();
    expect(ownerInsert.data?.id).toBeTruthy();

    const ownerUpdate = await fixture.users.ownerA.client
      .from("clinic_members")
      .update({ role: "receptionist" })
      .eq("id", ownerInsert.data?.id)
      .select("role")
      .single();

    expect(ownerUpdate.error).toBeNull();
    expect(ownerUpdate.data?.role).toBe("receptionist");

    const limitedPermission = await fixture.users.managerA.client.rpc("has_clinic_permission", {
      target_clinic_id: fixture.clinicA.id,
      required_permission: "staff.manage_limited",
    });
    const fullPermission = await fixture.users.managerA.client.rpc("has_clinic_permission", {
      target_clinic_id: fixture.clinicA.id,
      required_permission: "staff.manage",
    });

    expect(limitedPermission.data).toBe(true);
    expect(fullPermission.data).toBe(false);

    const managerInsertAssistant = await fixture.users.managerA.client.from("clinic_members").insert({
      clinic_id: fixture.clinicA.id,
      user_id: fixture.users.managerCandidate.appUserId,
      role: "assistant",
    });
    const managerInsertOwner = await fixture.users.managerA.client.from("clinic_members").insert({
      clinic_id: fixture.clinicA.id,
      user_id: fixture.users.elevatedCandidate.appUserId,
      role: "owner",
    });
    const managerUpdateOwner = await fixture.users.managerA.client
      .from("clinic_members")
      .update({ role: "assistant" })
      .eq("id", fixture.clinicA.ownerMemberId)
      .select("id");

    expect(managerInsertAssistant.error).toBeNull();
    expect(managerInsertOwner.error).toBeTruthy();
    expectDenied(managerUpdateOwner);
  });

  it("enforces current role split for direct RLS writes", async () => {
    const receptionistPatient = await fixture.users.receptionistA.client.from("patients").insert({
      clinic_id: fixture.clinicA.id,
      full_name: "Reception Patient",
      phone: "+962790000093",
    });
    const receptionistPayment = await fixture.users.receptionistA.client.from("payments").insert({
      clinic_id: fixture.clinicA.id,
      patient_id: fixture.clinicA.patientId,
      amount: 7,
      method: "cash",
    });
    const receptionistSettings = await fixture.users.receptionistA.client
      .from("clinic_settings")
      .update({ booking_enabled: true })
      .eq("clinic_id", fixture.clinicA.id)
      .select("clinic_id");

    expect(receptionistPatient.error).toBeNull();
    expect(receptionistPayment.error).toBeNull();
    expectDenied(receptionistSettings);

    for (const client of [
      fixture.users.doctorA.client,
      fixture.users.assistantA.client,
      fixture.users.accountantA.client,
    ]) {
      const patient = await client.from("patients").insert({
        clinic_id: fixture.clinicA.id,
        full_name: "Denied Patient",
        phone: "+962790000094",
      });
      const staff = await client.from("clinic_members").insert({
        clinic_id: fixture.clinicA.id,
        user_id: fixture.users.noMembership.appUserId,
        role: "assistant",
      });
      const settings = await client
        .from("clinic_settings")
        .update({ booking_enabled: false })
        .eq("clinic_id", fixture.clinicA.id)
        .select("clinic_id");

      expect(patient.error).toBeTruthy();
      expect(staff.error).toBeTruthy();
      expectDenied(settings);
    }

    const doctorPayment = await fixture.users.doctorA.client.from("payments").insert({
      clinic_id: fixture.clinicA.id,
      patient_id: fixture.clinicA.patientId,
      amount: 3,
      method: "cash",
    });
    const assistantBooking = await fixture.users.assistantA.client
      .from("public_booking_requests")
      .update({ status: "approved" })
      .eq("id", fixture.clinicA.rows.public_booking_requests.value)
      .select("id");
    const accountantPayment = await fixture.users.accountantA.client.from("payments").insert({
      clinic_id: fixture.clinicA.id,
      patient_id: fixture.clinicA.patientId,
      amount: 8,
      method: "cash",
    });

    expect(doctorPayment.error).toBeTruthy();
    expectDenied(assistantBooking);
    expect(accountantPayment.error).toBeNull();
  });

  it("keeps sensitive deferred tables closed to normal clinic users", async () => {
    const owner = fixture.users.ownerA.client;

    const audit = await owner.from("audit_logs").insert({
      clinic_id: fixture.clinicA.id,
      actor_user_id: fixture.users.ownerA.appUserId,
      action: "m5.direct",
      summary: "direct insert should fail",
    });
    const file = await owner.from("files").insert({
      clinic_id: fixture.clinicA.id,
      patient_id: fixture.clinicA.patientId,
      storage_key: `clinics/${fixture.clinicA.id}/blocked.pdf`,
    });
    const notification = await owner.from("notifications").insert({
      clinic_id: fixture.clinicA.id,
      recipient_member_id: fixture.clinicA.ownerMemberId,
      type: "blocked",
    });
    const subscription = await owner
      .from("subscriptions")
      .update({ status: "active" })
      .eq("id", fixture.clinicA.subscriptionId)
      .select("id");
    const subscriptionPayment = await owner.from("subscription_payments").insert({
      clinic_id: fixture.clinicA.id,
      subscription_id: fixture.clinicA.subscriptionId,
      amount: 9,
      method: "cash",
    });
    const supportGrant = await owner.from("support_access_grants").insert({
      clinic_id: fixture.clinicA.id,
      granted_to: fixture.users.ownerA.appUserId,
      reason: "blocked",
      expires_at: "2031-02-01T00:00:00Z",
    });

    expect(audit.error).toBeTruthy();
    expect(file.error).toBeTruthy();
    expect(notification.error).toBeTruthy();
    expectDenied(subscription);
    expect(subscriptionPayment.error).toBeTruthy();
    expect(supportGrant.error).toBeTruthy();
  });

  it("enforces the appointment overlap exclusion constraint", async () => {
    const base = {
      clinic_id: fixture.clinicA.id,
      patient_id: fixture.clinicA.patientId,
      doctor_member_id: fixture.clinicA.doctorMemberId,
      status: "booked",
    };

    const overlapping = await fixture.users.ownerA.client.from("appointments").insert({
      ...base,
      starts_at: "2031-01-01T09:10:00Z",
      ends_at: "2031-01-01T09:20:00Z",
    });
    const nonOverlapping = await fixture.users.ownerA.client.from("appointments").insert({
      ...base,
      starts_at: "2031-01-01T09:30:00Z",
      ends_at: "2031-01-01T10:00:00Z",
    });
    const cancelledOverlap = await fixture.users.ownerA.client.from("appointments").insert({
      ...base,
      status: "cancelled",
      starts_at: "2031-01-01T09:10:00Z",
      ends_at: "2031-01-01T09:20:00Z",
    });
    const differentDoctor = await fixture.users.ownerA.client.from("appointments").insert({
      ...base,
      doctor_member_id: fixture.clinicA.secondDoctorMemberId,
      starts_at: "2031-01-01T09:10:00Z",
      ends_at: "2031-01-01T09:20:00Z",
    });
    const differentClinic = await fixture.users.ownerB.client.from("appointments").insert({
      clinic_id: fixture.clinicB.id,
      patient_id: fixture.clinicB.patientId,
      doctor_member_id: fixture.clinicB.doctorMemberId,
      status: "booked",
      starts_at: "2031-01-01T09:10:00Z",
      ends_at: "2031-01-01T09:20:00Z",
    });

    expect(overlapping.error).toBeTruthy();
    expect(nonOverlapping.error).toBeNull();
    expect(cancelledOverlap.error).toBeNull();
    expect(differentDoctor.error).toBeNull();
    expect(differentClinic.error).toBeNull();
  });
});
