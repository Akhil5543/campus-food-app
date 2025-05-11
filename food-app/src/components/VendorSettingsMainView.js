import React from "react";

const VendorSettingsMainView = ({ vendor, setSettingsView }) => {
  return (
    <div className="settings-container">
      <h2>Account Settings</h2>
      <ul className="settings-list">
        <li onClick={() => setSettingsView("edit-name")}>
          <span>Name</span>
          <span>{vendor?.name}</span>
        </li>
        <li onClick={() => setSettingsView("edit-email")}>
          <span>Email</span>
          <span>{vendor?.email}</span>
        </li>
        <li onClick={() => setSettingsView("edit-password")}>
          <span>Password</span>
          <span>********</span>
        </li>
        <li className="danger" onClick={() => setSettingsView("delete-account")}>
          <span>Danger Zone</span>
          <span>Delete Account</span>
        </li>
      </ul>
    </div>
  );
};

export default VendorSettingsMainView;
