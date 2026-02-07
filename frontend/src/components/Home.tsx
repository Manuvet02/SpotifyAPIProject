import SpotifyUserCard from "./SpotifyUser";

type HomeProps = {
  userInfo?: any;
};

export default function Home({ userInfo }: HomeProps) {
  return (
    <div className="app-content center-content">
      {!userInfo ? (
        <div className="welcome-section">
          <h1>Welcome to SpotifyAPI</h1>
          <p style={{ marginTop: "1rem", color: "var(--spotify-grey)" }}>
            Please log in to view your stats and history.
          </p>
        </div>
      ) : (
        <div style={{ width: "100%", maxWidth: "800px", display: "flex", flexDirection: "column", alignItems: "center", gap: "3rem" }}>
          <div style={{ width: "100%" }}>
            <div className="section-header" style={{ justifyContent: "center" }}>
                <h1 className="section-title">Your Profile</h1>
            </div>
            <SpotifyUserCard user={userInfo} />
          </div>
        </div>
      )}
    </div>
  );
}
