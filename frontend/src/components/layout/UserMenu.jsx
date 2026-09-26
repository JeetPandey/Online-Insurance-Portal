import { FiLogOut, FiUser, FiSettings } from "react-icons/fi";

import useAuth from "../../hooks/useAuth";

const UserMenu = () => {
  const { user, logout } = useAuth();

  return (
    <div className="dropdown dropdown-end">
      <button type="button" tabIndex={0} className="flex items-center  gap-3 px-2 py-1.5 rounded-lg hover:bg-base-200">        
        <div className="w-9 h-9 rounded-full bg-primary text-primary-content flex items-center justify-center font-semibold">
          {user?.first_name?.charAt(0) || user?.username?.charAt(0) || "U"}
        </div>
        <div className="hidden md:block text-left">
          <div className="text-sm font-semibold">
            {user?.first_name
              ? `${user.first_name} ${user.last_name || ""}`
              : user?.username}
          </div>
          <div className="text-xs opacity-60">{user?.roles?.join(", ")}</div>
        </div>
      </button>

      <ul
        tabIndex={0}
        className="dropdown-content menu mt-3 z-100 p-2 shadow-lg bg-base-100 rounded-box w-56 border border-base-300 ">
        <li>
          <button>
            <FiUser />
            Profile
          </button>
        </li>

        <li>
          <button>
            <FiSettings />
            Settings
          </button>
        </li>

        <div className="divider my-1" />

        <li>
          <button className="text-error" onClick={logout}>
            <FiLogOut />
            Logout
          </button>
        </li>
      </ul>
    </div>
  );
};

export default UserMenu;
