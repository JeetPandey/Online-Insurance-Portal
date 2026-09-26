import { useState } from "react";
import { NavLink } from "react-router-dom";
import { navigation } from "../../utils/navigation";
import {FiChevronDown,FiChevronLeft,FiChevronRight,FiX} from "react-icons/fi";
import useAuth from "../../hooks/useAuth";


const Sidebar = ({ collapsed, mobileOpen, onToggle, onMobileClose }) => {
  const { user } = useAuth();
  const [openGroups, setOpenGroups] = useState({});
  const userRoles = user?.roles || [];
  const toggleGroup = (label) => {
    setOpenGroups((previous) => ({
      ...previous,
      [label]: !previous[label],
    }));
  };
  return (
    <>
      {/* Mobile overlay */}

      {mobileOpen && (
        <div
          className="
                        fixed
                        inset-0
                        z-40
                        bg-black/40
                        lg:hidden
                    "
          onClick={onMobileClose}
        />
      )}

      <aside
        className={`
                    fixed
                    top-0
                    left-0
                    z-50
                    h-screen
                    bg-base-100
                    border-r
                    border-base-300
                    transition-all
                    duration-300
                    flex
                    flex-col

                    ${collapsed ? "lg:w-20" : "lg:w-64"}

                    w-72

                    ${
                      mobileOpen
                        ? "translate-x-0"
                        : "-translate-x-full lg:translate-x-0"
                    }
                `}
      >
        {/* Logo */}

        <div
          className="
                        h-16
                        flex
                        items-center
                        justify-between
                        px-4
                        border-b
                        border-base-300
                    "
        >
          <div
            className={`
                            flex
                            items-center
                            gap-3
                            overflow-hidden
                            ${collapsed ? "lg:justify-center lg:w-full" : ""}
                        `}
          >
            <div
              className="
                                w-9
                                h-9
                                rounded-lg
                                bg-primary
                                text-primary-content
                                flex
                                items-center
                                justify-center
                                font-bold
                            "
            >
              A
            </div>

            {!collapsed && (
              <div className="hidden lg:block">
                <div className="font-bold">Application</div>

                <div className="text-xs opacity-60">Management System</div>
              </div>
            )}

            {/* Mobile always show title */}

            <div className="lg:hidden">
              <div className="font-bold">Application</div>

              <div className="text-xs opacity-60">Management System</div>
            </div>
          </div>

          {/* Mobile close */}

          <button
            type="button"
            className="
                            btn
                            btn-ghost
                            btn-sm
                            lg:hidden
                        "
            onClick={onMobileClose}
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Navigation */}

        <nav className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-1">
            {navigation.map((item) => {
              const visibleChildren = item.children?.filter(
                (child) => !child.roles || child.roles.some((role) => userRoles.includes(role)),
              );

              if (item.type === "group" && visibleChildren?.length === 0) {
                return null;
              }

              const Icon = item.icon;

              if (item.type === "item") {
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      onClick={onMobileClose}
                      className={({ isActive }) => `
                                                    flex
                                                    items-center
                                                    gap-3
                                                    px-3
                                                    py-2.5
                                                    rounded-lg
                                                    transition-colors

                                                    ${
                                                      isActive
                                                        ? "bg-primary text-primary-content"
                                                        : "hover:bg-base-200"
                                                    }

                                                    ${
                                                      collapsed
                                                        ? "lg:justify-center"
                                                        : ""
                                                    }
                                                `}
                    >
                      <Icon size={19} className="shrink-0" />

                      <span
                        className={`
                                                        truncate
                                                        ${
                                                          collapsed
                                                            ? "lg:hidden"
                                                            : ""
                                                        }
                                                    `}
                      >
                        {item.label}
                      </span>
                    </NavLink>
                  </li>
                );
              }

              const isOpen = openGroups[item.label];

              return (
                <li key={item.label}>
                  <button
                    type="button"
                    onClick={() => toggleGroup(item.label)}
                    className={`
                                                w-full
                                                flex
                                                items-center
                                                gap-3
                                                px-3
                                                py-2.5
                                                rounded-lg
                                                hover:bg-base-200
                                                transition-colors

                                                ${
                                                  collapsed
                                                    ? "lg:justify-center"
                                                    : ""
                                                }
                                            `}
                  >
                    <Icon size={19} className="shrink-0" />

                    <span
                      className={`
                                                    flex-1
                                                    text-left
                                                    ${
                                                      collapsed
                                                        ? "lg:hidden"
                                                        : ""
                                                    }
                                                `}
                    >
                      {item.label}
                    </span>

                    <span className={collapsed ? "lg:hidden" : ""}>
                      {isOpen ? <FiChevronDown /> : <FiChevronRight />}
                    </span>
                  </button>

                  {isOpen && (
                    <ul
                      className={`
                                                    mt-1
                                                    space-y-1
                                                    ${
                                                      collapsed
                                                        ? "lg:hidden"
                                                        : "pl-9"
                                                    }
                                                `}
                    >
                      {visibleChildren.map((child) => (
                        <li key={child.path}>
                          <NavLink
                            to={child.path}
                            onClick={onMobileClose}
                            className={({ isActive }) => `
                                                                    block
                                                                    px-3
                                                                    py-2
                                                                    rounded-lg
                                                                    text-sm

                                                                    ${
                                                                      isActive
                                                                        ? "bg-primary/10 text-primary font-medium"
                                                                        : "hover:bg-base-200"
                                                                    }
                                                                `}
                          >
                            {child.label}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Collapse button */}

        <div
          className="
                        hidden
                        lg:flex
                        p-3
                        border-t
                        border-base-300
                    "
        >
          <button
            type="button"
            onClick={onToggle}
            className="
                            btn
                            btn-ghost
                            btn-sm
                            w-full
                        "
          >
            {collapsed ? <FiChevronRight /> : <FiChevronLeft />}

            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
