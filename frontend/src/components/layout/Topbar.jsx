import { FiBell, FiMenu } from "react-icons/fi";

import UserMenu from "./UserMenu";

const Topbar = ({ onMobileMenu }) => {
  return (
    <header
      className=" h-16  bg-base-100 border-b border-base-300 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        {/* Mobile menu */}
        <button type="button" className=" btn btn-ghost btn-sm lg:hidden " onClick={onMobileMenu}>
          <FiMenu size={21} />
        </button>
        <div className="hidden sm:block">
          <div className="font-semibold">Agricultural </div>
          <div className="text-xs opacity-50">Consultant</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {/* Notification */}
        <button type="button" className="btn btn-ghost btn-circle">
          <div className="indicator">
            <span className="indicator-item badge badge-error badge-xs"/>
            <FiBell size={20} />
          </div>
        </button>
        <UserMenu />
      </div>
    </header>
  );
};

export default Topbar;
