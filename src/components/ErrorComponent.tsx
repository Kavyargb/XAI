import { Anchor, Button, Code, CopyButton, Group, Stack, Text, Title, Box } from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";
import { useNavigate } from "@tanstack/react-router";
import { Trans, useTranslation } from "react-i18next";

export default function ErrorComponent({ error }: { error: unknown }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Box
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        padding: "2rem",
      }}
    >
      <Box
        style={{
          maxWidth: 560,
          width: "100%",
          background: "rgba(22, 28, 44, 0.5)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.06)",
          borderRadius: "var(--xai-radius-xl, 20px)",
          padding: "2.5rem",
          boxShadow: "0 16px 48px rgba(0, 0, 0, 0.4)",
          animation: "fadeScaleIn 300ms cubic-bezier(0.16, 1, 0.3, 1) both",
        }}
      >
        <Stack align="center" gap="lg">
          {/* Animated error icon */}
          <Box
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "rgba(231, 76, 60, 0.1)",
              border: "1px solid rgba(231, 76, 60, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation: "pulseGlow 3s ease-in-out infinite",
              boxShadow: "0 0 20px rgba(231, 76, 60, 0.1)",
            }}
          >
            <IconAlertTriangle size="2rem" color="#e74c3c" />
          </Box>

          <Title
            order={3}
            ta="center"
            style={{
              fontFamily: "var(--xai-font-display, Outfit, sans-serif)",
              letterSpacing: "-0.02em",
            }}
          >
            {t("Error.Title")}
          </Title>

          {error instanceof Error ? (
            <Stack gap="xs" w="100%">
              <Text size="sm" ta="center" c="dimmed">
                <b>{error.name}:</b> {error.message}
              </Text>
              <Code
                block
                style={{
                  maxHeight: 200,
                  overflow: "auto",
                  fontSize: "0.72rem",
                  background: "rgba(0, 0, 0, 0.3)",
                  border: "1px solid rgba(255, 255, 255, 0.04)",
                  borderRadius: "var(--xai-radius-sm, 8px)",
                }}
              >
                {error.stack}
              </Code>
            </Stack>
          ) : (
            <Text size="sm" ta="center" c="dimmed">
              <b>{t("Error.Unexpected")}:</b> {JSON.stringify(error)}
            </Text>
          )}

          <Group>
            {error instanceof Error && (
              <CopyButton value={`${error.message}\n${error.stack}`}>
                {({ copied, copy }) => (
                  <Button
                    variant="subtle"
                    color={copied ? "teal" : "gray"}
                    onClick={copy}
                    size="sm"
                  >
                    {copied ? t("Common.Copied") : t("Error.CopyStackTrace")}
                  </Button>
                )}
              </CopyButton>
            )}
            <Button
              variant="filled"
              size="sm"
              onClick={() => navigate({ to: "/" }).then(() => window.location.reload())}
              style={{
                background: "linear-gradient(135deg, var(--xai-cyan, #00b4d8) 0%, #0077b6 100%)",
                boxShadow: "0 4px 16px rgba(0, 180, 216, 0.25)",
              }}
            >
              {t("Menu.View.Reload")}
            </Button>
          </Group>

          <Text size="xs" c="dimmed" ta="center">
            <Trans
              i18nKey="Error.ReportIssue"
              components={{
                github: (
                  <Anchor
                    href="https://github.com/franciscoBSalgueiro/en-croissant/issues/new?assignees=&labels=bug&projects=&template=bug.yml"
                    target="_blank"
                  />
                ),
                discord: <Anchor href="https://discord.com/invite/tdYzfDbSSW" target="_blank" />,
              }}
            />
          </Text>
        </Stack>
      </Box>
    </Box>
  );
}
