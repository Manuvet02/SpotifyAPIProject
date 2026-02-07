import React from "react";
import type { SpotifyUser } from "../types/user";
import "./SpotifyUser.css";

type Props = {
  user: SpotifyUser;
};

export class SpotifyUserCard extends React.Component<Props> {
  render() {
    const { user } = this.props;
    if (!user) return null;

    return (
      <div className="spotify-user-card">
        {user.images && user.images.length > 0 ? (
          <img
            src={user.images[0].url}
            alt={user.display_name}
            className="spotify-user-avatar"
          />
        ) : (
          <div className="spotify-user-noimage">
            <span>{user.display_name?.charAt(0) || "?"}</span>
          </div>
        )}

        <div className="spotify-user-details">
          <h2 className="spotify-user-name">{user.display_name}</h2>
          {user.email && <div className="spotify-user-email">{user.email}</div>}

          <div className="spotify-user-info">
            <span>
              <strong>{user.followers?.total ?? 0}</strong> Followers
            </span>
            <span>•</span>
            <span>
              <strong>{user.product ?? "Free"}</strong> Plan
            </span>
            <span>•</span>
            <span>
              <strong>{user.country ?? "—"}</strong>
            </span>
          </div>

          <div className="spotify-user-link">
            {user.external_urls?.spotify && (
              <a
                href={user.external_urls.spotify}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open on Spotify
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default SpotifyUserCard;
