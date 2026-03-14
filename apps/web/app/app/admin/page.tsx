import { getAdminOverview } from "../../../lib/admin";
import { requireTenantAdminSession } from "../../../lib/auth-guards";
import { DataTable, type DataTableColumn } from "../../../components/data-table";
import { FeedbackBanner } from "../../../components/feedback-banner";
import { getUserFacingMessageFromParam } from "../../../lib/user-error-messages";
import {
  createFacilityAction,
  createOrganizationAction,
  inviteMembershipAction,
  updateMembershipAction
} from "./actions";

const ROLE_OPTIONS = [
  "tenant_admin",
  "executive",
  "clinical_analyst",
  "finance_analyst",
  "compliance_admin",
  "integration_engineer"
] as const;

const ROLE_LABELS: Record<(typeof ROLE_OPTIONS)[number], string> = {
  tenant_admin: "Administrator",
  executive: "Executive",
  clinical_analyst: "Clinical analyst",
  finance_analyst: "Finance analyst",
  compliance_admin: "Compliance admin",
  integration_engineer: "Integration manager"
};

const inputClassName =
  "w-full rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100";

const labelClassName = "text-xs font-semibold uppercase tracking-[0.16em] text-slate-500";

const organizationColumns: Array<
  DataTableColumn<{
    name: string;
    type: string;
    status: string;
  }>
> = [
  { key: "name", header: "Name" },
  { key: "type", header: "Type" },
  { key: "status", header: "Status" }
];

const facilityColumns: Array<
  DataTableColumn<{
    name: string;
    organization: string;
    type: string;
    timezone: string;
  }>
> = [
  { key: "name", header: "Name" },
  { key: "organization", header: "Organization" },
  { key: "type", header: "Type" },
  { key: "timezone", header: "Timezone" }
];

export default async function TenantAdminPage({
  searchParams
}: {
  searchParams?: {
    success?: string;
    error?: string;
  };
}) {
  const session = await requireTenantAdminSession();
  const overview = await getAdminOverview(session.context);
  const organizationRows = overview.organizations.map((organization) => ({
    name: organization.name,
    type: organization.type,
    status: organization.status
  }));
  const facilityRows = overview.facilities.map((facility) => ({
    name: facility.name,
    organization:
      overview.organizations.find((organization) => organization.id === facility.organization_id)?.name ??
      "Unknown",
    type: facility.facility_type,
    timezone: facility.timezone
  }));

  return (
    <>
      <section className="rounded-[24px] border border-slate-200/70 bg-white/78 p-5 shadow-[0_20px_70px_rgba(15,23,42,0.10)] backdrop-blur sm:p-6 md:p-8 xl:p-10">
        <div className="space-y-6">
          <div className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
            Administration
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold tracking-[-0.04em] text-slate-950 md:text-5xl">
              Manage organizations, facilities, and user access.
            </h1>
            <p className="max-w-3xl text-base leading-8 text-slate-600">
              Create organizations and facilities, invite users, and assign roles and access scope.
            </p>
          </div>

          <div className="space-y-3">
            {searchParams?.success ? (
              <FeedbackBanner message={searchParams.success} tone="success" />
            ) : null}
            {searchParams?.error ? (
              <FeedbackBanner
                message={getUserFacingMessageFromParam(searchParams.error, "admin")}
                tone="error"
              />
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-3xl border border-slate-200/80 bg-white/80 p-5">
              <h3 className="text-sm font-semibold text-slate-500">Organizations</h3>
              <p className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-slate-950">
                {overview.organizations.length}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Organizations in your health system.</p>
            </article>
            <article className="rounded-3xl border border-slate-200/80 bg-white/80 p-5">
              <h3 className="text-sm font-semibold text-slate-500">Facilities</h3>
              <p className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-slate-950">
                {overview.facilities.length}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Operational and reporting locations.
              </p>
            </article>
            <article className="rounded-3xl border border-slate-200/80 bg-white/80 p-5">
              <h3 className="text-sm font-semibold text-slate-500">User access</h3>
              <p className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-slate-950">
                {overview.memberships.length}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                User access and roles.
              </p>
            </article>
            <article className="rounded-3xl border border-slate-200/80 bg-white/80 p-5">
              <h3 className="text-sm font-semibold text-slate-500">EHR connections</h3>
              <p className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-slate-950">
                {overview.dataSources.length}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Registered EHR or data sources.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="grid gap-5 sm:gap-6 xl:grid-cols-2">
        <div className="rounded-[24px] border border-slate-200/70 bg-white/78 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-6 md:p-7">
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">
            Create organization
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Add the organizational entities that will own facilities, data sources, and reporting
            scope.
          </p>
          <form action={createOrganizationAction} className="mt-6 space-y-4">
            <label className="block space-y-2">
              <span className={labelClassName}>Name</span>
              <input className={inputClassName} name="name" placeholder="Northwind Regional Health" required />
            </label>
            <label className="block space-y-2">
              <span className={labelClassName}>Type</span>
              <select className={inputClassName} defaultValue="hospital" name="type">
                <option value="hospital">Hospital</option>
                <option value="health-system">Health system</option>
                <option value="clinic-group">Clinic group</option>
              </select>
            </label>
            <button
              className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(16,185,129,0.28)] transition hover:bg-emerald-600"
              type="submit"
            >
              Create organization
            </button>
          </form>
        </div>

        <div className="rounded-[24px] border border-slate-200/70 bg-white/78 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-6 md:p-7">
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">
            Create facility
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Add the physical care locations that will anchor encounter, reporting, and access
            scope.
          </p>
          <form action={createFacilityAction} className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="block space-y-2 md:col-span-2">
              <span className={labelClassName}>Organization</span>
              <select className={inputClassName} name="organizationId" required defaultValue="">
                <option value="" disabled>
                  Select organization
                </option>
                {overview.organizations.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-2 md:col-span-2">
              <span className={labelClassName}>Facility name</span>
              <input className={inputClassName} name="name" placeholder="Northwind Main Campus" required />
            </label>
            <label className="block space-y-2">
              <span className={labelClassName}>Type</span>
              <select className={inputClassName} defaultValue="hospital" name="facilityType">
                <option value="hospital">Hospital</option>
                <option value="clinic">Clinic</option>
                <option value="lab">Lab</option>
                <option value="network">Network</option>
              </select>
            </label>
            <label className="block space-y-2">
              <span className={labelClassName}>Timezone</span>
              <input className={inputClassName} defaultValue="America/Chicago" name="timezone" />
            </label>
            <label className="block space-y-2 md:col-span-2">
              <span className={labelClassName}>External ID</span>
              <input className={inputClassName} name="externalId" placeholder="fac-001" />
            </label>
            <button
              className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(16,185,129,0.28)] transition hover:bg-emerald-600 md:col-span-2"
              type="submit"
            >
              Create facility
            </button>
          </form>
        </div>
      </section>

      <section className="rounded-[30px] border border-slate-200/70 bg-white/78 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-6 md:p-7">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">
            Invite user and assign membership
          </h2>
          <p className="text-sm leading-6 text-slate-600">
            Create access for analysts, executives, or operations staff.
          </p>
        </div>

        <form action={inviteMembershipAction} className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className="block space-y-2">
            <span className={labelClassName}>Email</span>
            <input
              className={inputClassName}
              name="email"
              placeholder="analyst@hospital.org"
              required
              type="email"
            />
          </label>
          <label className="block space-y-2">
            <span className={labelClassName}>Full name</span>
            <input className={inputClassName} name="fullName" placeholder="Jordan Lee" />
          </label>
          <label className="block space-y-2">
            <span className={labelClassName}>Role</span>
            <select className={inputClassName} defaultValue="executive" name="roleName">
              {ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-2">
            <span className={labelClassName}>Organization scope</span>
            <select className={inputClassName} defaultValue="" name="organizationId">
              <option value="">All organizations</option>
              {overview.organizations.map((organization) => (
                <option key={organization.id} value={organization.id}>
                  {organization.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-2">
            <span className={labelClassName}>Facility scope</span>
            <select className={inputClassName} defaultValue="" name="facilityId">
              <option value="">No facility restriction</option>
              {overview.facilities.map((facility) => (
                <option key={facility.id} value={facility.id}>
                  {facility.name}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            <button
              className="inline-flex w-full items-center justify-center rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(16,185,129,0.28)] transition hover:bg-emerald-600"
              type="submit"
            >
              Invite and assign
            </button>
          </div>
        </form>
      </section>

      <section className="grid gap-5 sm:gap-6 xl:grid-cols-2">
        <div className="rounded-[30px] border border-slate-200/70 bg-white/78 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-6 md:p-7">
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">Organizations</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
            Organization records currently available.
          </p>
          <div className="mt-6">
            <DataTable
              columns={organizationColumns}
              data={organizationRows}
              emptyMessage="No organizations have been created yet."
            />
          </div>
        </div>

        <div className="rounded-[30px] border border-slate-200/70 bg-white/78 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-6 md:p-7">
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">Facilities</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Facility records and their current organization alignment.
          </p>
          <div className="mt-6">
            <DataTable
              columns={facilityColumns}
              data={facilityRows}
              emptyMessage="No facilities have been created yet."
            />
          </div>
        </div>
      </section>

      <section className="rounded-[30px] border border-slate-200/70 bg-white/78 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-6 md:p-7">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">
            Membership access
          </h2>
          <p className="text-sm leading-6 text-slate-600">
            Update display names, roles, organization scope, facility scope, and suspension state
            for users.
          </p>
        </div>

        <div className="mt-6 grid gap-4">
          {overview.memberships.length > 0 ? (
            overview.memberships.map((membership) => (
              <form
                action={updateMembershipAction}
                className="rounded-[28px] border border-slate-200/80 bg-white/85 p-5 shadow-sm"
                key={membership.id}
              >
                <input name="membershipId" type="hidden" value={membership.id} />
                <input name="userId" type="hidden" value={membership.user_id} />

                <div className="mb-5 flex flex-col gap-3 border-b border-slate-200/70 pb-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">
                      {membership.user?.full_name ?? membership.user?.email ?? membership.user_id}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {membership.user?.email ?? "Pending profile"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
                      {ROLE_LABELS[membership.role_name as (typeof ROLE_OPTIONS)[number]] ?? membership.role_name}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${
                        membership.status === "active"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {membership.status}
                    </span>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                  <label className="block space-y-2 xl:col-span-2">
                    <span className={labelClassName}>Full name</span>
                    <input
                      className={inputClassName}
                      defaultValue={membership.user?.full_name ?? ""}
                      name="fullName"
                      placeholder="Full name"
                    />
                  </label>
                  <label className="block space-y-2">
                    <span className={labelClassName}>Role</span>
                    <select className={inputClassName} defaultValue={membership.role_name} name="roleName">
                      {ROLE_OPTIONS.map((role) => (
                        <option key={role} value={role}>
                          {ROLE_LABELS[role]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block space-y-2">
                    <span className={labelClassName}>Status</span>
                    <select className={inputClassName} defaultValue={membership.status} name="status">
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </label>
                  <label className="block space-y-2 xl:col-span-2">
                    <span className={labelClassName}>Organization</span>
                    <select
                      className={inputClassName}
                      defaultValue={membership.organization_id ?? ""}
                      name="organizationId"
                    >
                      <option value="">All organizations</option>
                      {overview.organizations.map((organization) => (
                        <option key={organization.id} value={organization.id}>
                          {organization.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block space-y-2 xl:col-span-2">
                    <span className={labelClassName}>Facility</span>
                    <select
                      className={inputClassName}
                      defaultValue={membership.facility_id ?? ""}
                      name="facilityId"
                    >
                      <option value="">No restriction</option>
                      {overview.facilities.map((facility) => (
                        <option key={facility.id} value={facility.id}>
                          {facility.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="flex items-end xl:col-span-1">
                    <button
                      className="inline-flex w-full items-center justify-center rounded-full border border-slate-300/80 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      type="submit"
                    >
                      Save access
                    </button>
                  </div>
                </div>
              </form>
            ))
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/70 px-5 py-8 text-sm text-slate-500">
              No users have been invited yet.
            </div>
          )}
        </div>
      </section>
    </>
  );
}
