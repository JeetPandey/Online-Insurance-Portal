import { Link, useLocation } from "react-router-dom";

const Breadcrumb = () => {
  const location = useLocation();

  const segments = location.pathname.split("/").filter(Boolean);

  return (
    <div className="breadcrumbs text-sm mb-5">
      <ul>
        <li>
          <Link to="/dashboard">Dashboard</Link>
        </li>

        {segments
          .filter((segment) => segment !== "dashboard")
          .map((segment, index) => {
            const path = "/" + segments.slice(0, index + 2).join("/");

            const label = segment
              .replace(/-/g, " ")
              .replace(/\b\w/g, (char) => char.toUpperCase());

            return (
              <li key={path}>
                <Link to={path}>{label}</Link>
              </li>
            );
          })}
      </ul>
    </div>
  );
};

export default Breadcrumb;
