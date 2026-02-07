import "./Navbar.css";
import { Link } from "react-router-dom";

type Props = {
  user?: any | null;
  onLogin: () => void;
  onLogout: () => void;
};

export default function Navbar({ user, onLogin, onLogout }: Props) {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-left">
          <div className="navbar-brand">SpotifyAPI</div>
          <div className="nav-links">
            <Link to="/" className="nav-link">
              Home
            </Link>
            {user && (
              <>
                <Link to="/history" className="nav-link">
                  History
                </Link>
                <Link to="/artists" className="nav-link">
                  Artists
                </Link>
                <Link to="/tracks" className="nav-link">
                  Tracks
                </Link>
                <Link to="/tournament" className="nav-link">
                  Tournament
                </Link>
                <Link to="/quiz" className="nav-link">
                  Song Quiz
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="navbar-right">
          {user ? (
            <div className="navbar-user-group">
              <div className="navbar-user" title="Profile">
                {user.images && user.images.length > 0 ? (
                  <img
                    src={user.images[0].url}
                    alt={user.display_name}
                    className="navbar-avatar"
                  />
                ) : (
                  <div
                    className="navbar-avatar"
                    style={{ background: "#555" }}
                  />
                )}
                <span className="navbar-name">{user.display_name}</span>
              </div>
              <button className="logout-btn" onClick={onLogout} title="Logout">
                Logout
              </button>
            </div>
          ) : (
            <button className="login-btn" onClick={onLogin}>
              Login with Spotify
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
