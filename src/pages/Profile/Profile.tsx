import { Avatar, Button, Card, Empty, Space, Tag } from "antd";
import { Check, Crown, KeyRound, UserCog } from "lucide-react";
import AppButton from "../../components/ui/Button";
import { useState } from "react";
import PageHeader from "../../components/Common/PageHeader";
import PageMeta from "../../components/Common/PageMeta";
import PermissionGate from "../../components/Common/PermissionGate";
import ChangePasswordModal from "../../components/modal/user/ChangePasswordModal";
import UpdateProfileModal from "../../components/modal/user/UpdateProfileModal";
import { useMe } from "../../hooks/useMe";

const Profile = () => {
  const { me, isLoading } = useMe();
  const [isOpenUpdate, setIsOpenUpdate] = useState(false);
  const [isOpenChangePassword, setIsOpenChangePassword] = useState(false);

  const initials = (me?.name || "?").charAt(0).toUpperCase();
  const roleLabel = (me?.role || "USER").toUpperCase();
  const designationName =
    typeof me?.designationId === "object"
      ? me?.designationId?.name
      : undefined;

  const isSuperAdmin = roleLabel === "SUPER_ADMIN";
  const permissions: { module: string; actions: string[] }[] = Array.isArray(
    me?.permissions
  )
    ? me!.permissions
    : [];
  const totalActions = permissions.reduce(
    (sum, p) => sum + (p.actions?.length ?? 0),
    0
  );

  return (
    <div>
      <PageMeta
        title="Profile - POS & Inventory Admin Panel"
        description="View and update your own profile"
        keywords="profile, account, POS & Inventory"
        canonicalUrl={`${window.location.origin}/settings/profile`}
        noindex={true}
      />
      <PageHeader
        title="My Profile"
        subtitle="Your account details — update them or change your password"
        breadcrumbs={[
          { title: "Dashboard", path: "/" },
          { title: "Settings" },
          { title: "Profile" },
        ]}
      />

      <Card
        loading={isLoading}
        className="!rounded-xl !overflow-hidden"
        styles={{ body: { padding: 0 } }}
      >
        {/* Hero — primary purple */}
        <div className="bg-gradient-to-r from-[#285F14] to-[#3c8820] text-white p-6 md:p-7">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <Avatar
              size={88}
              src={me?.profilePhoto || undefined}
              className="!bg-white/15 !text-white border-2 border-white/30 backdrop-blur-sm font-bold text-3xl shrink-0"
            >
              {!me?.profilePhoto && initials}
            </Avatar>

            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold text-white m-0 truncate">
                {me?.name || "—"}
              </h2>
              <div className="flex items-center gap-2 flex-wrap mt-2">
                <Tag className="!bg-white/15 !text-white !border-white/25 !font-semibold">
                  {roleLabel}
                </Tag>
                {designationName && (
                  <Tag className="!bg-white/10 !text-white/90 !border-white/20 !font-medium">
                    {designationName}
                  </Tag>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-white/80 mt-3">
                <span>{me?.email || "—"}</span>
                <span>{me?.phone || "—"}</span>
              </div>
            </div>

            <Space wrap className="md:self-start">
              <PermissionGate module="Profile" action="Update">
                <Button
                  icon={<UserCog className="w-4 h-4" />}
                  onClick={() => setIsOpenUpdate(true)}
                  className="!bg-white/15 !text-white !border-white/25 hover:!bg-white/25 hover:!border-white/40 !font-semibold"
                >
                  Update Profile
                </Button>
              </PermissionGate>
              <PermissionGate module="Profile" action="Change Password">
                <Button
                  icon={<KeyRound className="w-4 h-4" />}
                  onClick={() => setIsOpenChangePassword(true)}
                  className="!bg-white !text-primary hover:!bg-white/90 !border-0 !font-semibold"
                >
                  Change Password
                </Button>
              </PermissionGate>
            </Space>
          </div>
        </div>

        {/* Details — white */}
        <div className="p-6 md:p-7 bg-white">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Name
              </div>
              <div className="text-sm text-gray-900 truncate">
                {me?.name || "—"}
              </div>
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Email
              </div>
              <div className="text-sm text-gray-900 truncate">
                {me?.email || "—"}
              </div>
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Phone
              </div>
              <div className="text-sm text-gray-900 truncate">
                {me?.phone || "—"}
              </div>
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Role
              </div>
              <div>
                <Tag color="var(--primary)" className="font-semibold">
                  {roleLabel}
                </Tag>
              </div>
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Designation
              </div>
              <div className="text-sm text-gray-900 truncate">
                {designationName || "—"}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Permissions section */}
      <Card
        className="!rounded-xl mt-5"
        title={
          <div className="flex items-center justify-between">
            <span className="font-bold text-gray-900">My Permissions</span>
            {!isSuperAdmin && (
              <Tag color="var(--primary)" className="font-semibold">
                {totalActions} action{totalActions === 1 ? "" : "s"} ·{" "}
                {permissions.length} module
                {permissions.length === 1 ? "" : "s"}
              </Tag>
            )}
          </div>
        }
      >
        {isSuperAdmin ? (
          <div className="flex items-center gap-3 p-5 rounded-xl bg-gradient-to-r from-primary-50 to-primary-100/50 border border-primary-200">
            <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-md shadow-primary/30">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-primary-700 text-base">
                Full system access
              </div>
              <div className="text-sm text-gray-600 mt-0.5">
                As a SUPER_ADMIN you bypass every permission check.
              </div>
            </div>
          </div>
        ) : permissions.length === 0 ? (
          <Empty
            description="No permissions have been granted to your role yet"
            className="py-8"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {permissions.map((p: any) => (
              <div
                key={p.module}
                className="rounded-xl border border-gray-200 bg-white p-4 hover:border-primary/50 transition-all"
              >
                <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-gray-100">
                  <h4 className="font-bold text-gray-800 text-xs uppercase tracking-wide m-0 truncate">
                    {p.module}
                  </h4>
                  <Tag
                    color="var(--primary)"
                    className="!text-[10px] !font-bold !leading-none !py-1 !px-2 !mr-0"
                  >
                    {p.actions?.length || 0}
                  </Tag>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(p.actions || []).map((a: string) => (
                    <AppButton
                      key={a}
                      variant="primary"
                      disabled
                      className="!text-xs !font-semibold !px-3 !py-1 !rounded-md !shadow-none inline-flex items-center gap-1 !bg-primary !text-white !pointer-events-none"
                    >
                      <Check className="w-3 h-3" />
                      {a}
                    </AppButton>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {isOpenUpdate && me?._id && (
        <UpdateProfileModal
          open={isOpenUpdate}
          setOpen={setIsOpenUpdate}
          data={me}
        />
      )}

      {isOpenChangePassword && me?._id && (
        <ChangePasswordModal
          open={isOpenChangePassword}
          setOpen={setIsOpenChangePassword}
          userId={me._id}
          userName={me.name}
          self
        />
      )}
    </div>
  );
};

export default Profile;
