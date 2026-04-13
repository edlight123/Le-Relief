"use client";

import { useState, useEffect } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Card, { CardHeader, CardContent } from "@/components/ui/Card";

export default function SettingsPage() {
  const [profile, setProfile] = useState({ name: "", email: "" });
  const [socials, setSocials] = useState({
    instagram: "",
    facebook: "",
    x: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/users/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.name) setProfile({ name: data.name, email: data.email });
      });

    fetch("/api/social-links")
      .then((r) => r.json())
      .then((data) => {
        if (data.links) {
          const map: Record<string, string> = {};
          data.links.forEach((l: { platform: string; url: string }) => {
            map[l.platform] = l.url;
          });
          setSocials((prev) => ({ ...prev, ...map }));
        }
      });
  }, []);

  async function handleSaveProfile() {
    setSaving(true);
    setMessage("");
    await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: profile.name }),
    });
    setMessage("Profile updated");
    setSaving(false);
  }

  async function handleSaveSocials() {
    setSaving(true);
    setMessage("");
    await fetch("/api/social-links", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(socials),
    });
    setMessage("Social links updated");
    setSaving(false);
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
        Settings
      </h1>

      {message && (
        <p className="text-sm text-green-600 dark:text-green-400">{message}</p>
      )}

      {/* Profile */}
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
            Profile
          </h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Name"
            id="settings-name"
            value={profile.name}
            onChange={(e) =>
              setProfile((p) => ({ ...p, name: e.target.value }))
            }
          />
          <Input
            label="Email"
            id="settings-email"
            value={profile.email}
            disabled
          />
          <Button onClick={handleSaveProfile} disabled={saving} size="sm">
            Save Profile
          </Button>
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
            Social Links
          </h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Instagram"
            id="instagram"
            placeholder="https://instagram.com/..."
            value={socials.instagram}
            onChange={(e) =>
              setSocials((s) => ({ ...s, instagram: e.target.value }))
            }
          />
          <Input
            label="Facebook"
            id="facebook"
            placeholder="https://facebook.com/..."
            value={socials.facebook}
            onChange={(e) =>
              setSocials((s) => ({ ...s, facebook: e.target.value }))
            }
          />
          <Input
            label="X (Twitter)"
            id="x"
            placeholder="https://x.com/..."
            value={socials.x}
            onChange={(e) =>
              setSocials((s) => ({ ...s, x: e.target.value }))
            }
          />
          <Button onClick={handleSaveSocials} disabled={saving} size="sm">
            Save Social Links
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
