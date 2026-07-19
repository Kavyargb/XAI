import { Anchor, Box, Group, Modal, Stack, Text, Badge } from "@mantine/core";
import {
  IconBrandGithub,
  IconCpu,
  IconDeviceDesktop,
  IconInfoCircle,
} from "@tabler/icons-react";
import { getTauriVersion, getVersion } from "@tauri-apps/api/app";
import { arch, version as OSVersion, type } from "@tauri-apps/plugin-os";
import { useEffect, useState } from "react";

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Group
      gap="sm"
      py={8}
      px={12}
      style={{
        background: "rgba(255, 255, 255, 0.02)",
        borderRadius: "var(--xai-radius-sm, 8px)",
        border: "1px solid rgba(255, 255, 255, 0.03)",
      }}
    >
      <Box style={{ color: "rgba(255, 255, 255, 0.35)", flexShrink: 0 }}>
        {icon}
      </Box>
      <div style={{ flex: 1 }}>
        <Text size="xs" c="dimmed" fw={600} style={{ letterSpacing: "0.04em", textTransform: "uppercase" }}>
          {label}
        </Text>
        <Text size="sm" fw={500}>
          {value}
        </Text>
      </div>
    </Group>
  );
}

function AboutModal({
  opened,
  setOpened,
}: {
  opened: boolean;
  setOpened: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [info, setInfo] = useState<{
    version: string;
    tauri: string;
    os: string;
    architecture: string;
    osVersion: string;
  } | null>(null);

  useEffect(() => {
    async function load() {
      const os = await type();
      const version = await getVersion();
      const tauri = await getTauriVersion();
      const architecture = await arch();
      const osVersion = await OSVersion();
      setInfo({ version, tauri, os, architecture, osVersion });
    }
    load();
  }, []);

  return (
    <Modal
      centered
      opened={opened}
      onClose={() => setOpened(false)}
      title={null}
      withCloseButton
      size="sm"
      styles={{
        content: {
          background: "rgba(16, 20, 32, 0.95)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(255, 255, 255, 0.06)",
        },
        header: {
          background: "transparent",
        },
      }}
    >
      <Stack gap="md" align="center" pb="xs">
        {/* Logo & Branding */}
        <Box
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "rgba(0, 180, 216, 0.08)",
            border: "1px solid rgba(0, 180, 216, 0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.6rem",
            boxShadow: "0 0 20px rgba(0, 180, 216, 0.1)",
          }}
        >
          ♚
        </Box>

        <div style={{ textAlign: "center" }}>
          <Text
            size="lg"
            fw={800}
            style={{
              fontFamily: "var(--xai-font-display, Outfit, sans-serif)",
              letterSpacing: "0.2em",
              background: "linear-gradient(135deg, #fff 0%, #a5b4fc 50%, #00b4d8 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            RECKLESS AI
          </Text>
          <Badge
            variant="light"
            size="sm"
            mt={4}
            style={{
              background: "rgba(0, 180, 216, 0.1)",
              color: "#00b4d8",
              border: "1px solid rgba(0, 180, 216, 0.15)",
            }}
          >
            v{info?.version || "..."}
          </Badge>
        </div>

        {/* System Info Cards */}
        <Stack gap={6} w="100%" mt="xs">
          <InfoRow
            icon={<IconInfoCircle size="1rem" />}
            label="Tauri"
            value={info?.tauri || "Loading..."}
          />
          <InfoRow
            icon={<IconDeviceDesktop size="1rem" />}
            label="Operating System"
            value={info ? `${info.os} ${info.osVersion}` : "Loading..."}
          />
          <InfoRow
            icon={<IconCpu size="1rem" />}
            label="Architecture"
            value={info?.architecture || "Loading..."}
          />
        </Stack>

        {/* GitHub Link */}
        <Group gap="xs" mt="xs">
          <IconBrandGithub size="0.9rem" style={{ color: "rgba(255, 255, 255, 0.4)" }} />
          <Anchor
            href="https://github.com/Kavyargb/XAI"
            target="_blank"
            rel="noreferrer"
            size="sm"
            c="dimmed"
            style={{ transition: "color 150ms ease" }}
          >
            Reckless AI Repository
          </Anchor>
        </Group>
      </Stack>
    </Modal>
  );
}

export default AboutModal;
