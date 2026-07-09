"use no memo";
import { AppShellSection, Group, Stack, Text, Box } from "@mantine/core";
import {
  type Icon,
  IconChess,
  IconCpu,
  IconDatabase,
  IconFiles,
  IconSettings,
  IconUser,
} from "@tabler/icons-react";
import { Link, useMatchRoute } from "@tanstack/react-router";
import cx from "clsx";
import { useTranslation } from "react-i18next";
import { useAtomValue } from "jotai";
import { sessionsAtom } from "@/state/atoms";
import classes from "./Sidebar.module.css";

interface NavbarLinkProps {
  icon: Icon;
  label: string;
  url: string;
}

function NavbarLink({ url, icon: Icon, label }: NavbarLinkProps) {
  const match = useMatchRoute();
  const isActive = match({ to: url, fuzzy: true }) !== false;
  return (
    <Link
      to={url}
      className={cx(classes.link, {
        [classes.active]: isActive,
      })}
    >
      <Icon size="1.25rem" stroke={1.5} className={classes.linkIcon} />
      <span className={classes.linkLabel}>{label}</span>
    </Link>
  );
}

const linksdata = [
  { icon: IconChess, label: "Board", url: "/" },
  { icon: IconUser, label: "User", url: "/accounts" },
  { icon: IconFiles, label: "Files", url: "/files" },
  { icon: IconDatabase, label: "Databases", url: "/databases" },
  { icon: IconCpu, label: "Engines", url: "/engines" },
];

export function SideBar() {
  const { t } = useTranslation();
  const sessions = useAtomValue(sessionsAtom);

  // Extract active profile info
  const chessComSession = sessions.find((s) => s.chessCom);
  const lichessSession = sessions.find((s) => s.lichess);

  const activePlayer =
    chessComSession?.chessCom?.username ||
    lichessSession?.lichess?.username ||
    sessions[0]?.player ||
    "KnightOwl";
  const isLogged = sessions.length > 0;

  // Retrieve rating from active session or default
  let highestRating = 2420;
  if (isLogged) {
    if (chessComSession?.chessCom?.stats) {
      const stats = chessComSession.chessCom.stats;
      highestRating =
        Math.max(
          stats.chess_rapid?.last.rating || 0,
          stats.chess_blitz?.last.rating || 0,
          stats.chess_daily?.last.rating || 0
        ) || 2420;
    } else if (lichessSession?.lichess?.account?.perfs) {
      const perfs = lichessSession.lichess.account.perfs;
      highestRating =
        Math.max(
          perfs.rapid?.rating || 0,
          perfs.blitz?.rating || 0,
          perfs.classical?.rating || 0,
          perfs.puzzle?.rating || 0
        ) || 2420;
    }
  }

  const links = linksdata.map((link) => (
    <NavbarLink {...link} label={t(`SideBar.${link.label}`)} key={link.label} />
  ));

  return (
    <Box className={classes.sidebarContainer}>
      {/* Top logo */}
      <AppShellSection className={classes.logoSection}>
        <Group gap="xs" justify="center">
          <Text className={classes.logoText}>Reckless CHESS</Text>
        </Group>
      </AppShellSection>

      {/* Main Nav Links */}
      <AppShellSection grow className={classes.linksSection}>
        <Stack gap="xs">
          {links}
        </Stack>
      </AppShellSection>

      {/* Bottom Profile and Settings */}
      <AppShellSection className={classes.bottomSection}>
        <Stack gap="md">
          <NavbarLink icon={IconSettings} label={t("SideBar.Settings")} url="/settings" />
          
          <Box className={classes.profileCard}>
            <Group gap="sm" wrap="nowrap">
              <Box className={classes.avatarWrapper}>
                <img
                  src={isLogged ? "/logo.png" : "https://api.dicebear.com/7.x/bottts/svg?seed=chess"}
                  alt="avatar"
                  className={classes.avatarImage}
                />
              </Box>
              <div style={{ minWidth: 0, flex: 1 }}>
                <Text className={classes.profileName} truncate>
                  {activePlayer}
                </Text>
                <Text className={classes.profileTitle}>
                  {isLogged ? "Chess Master" : "Pro Player"}
                </Text>
              </div>
              <Box className={classes.ratingBadge}>
                🛡️ {highestRating}
              </Box>
            </Group>
          </Box>
        </Stack>
      </AppShellSection>
    </Box>
  );
}
