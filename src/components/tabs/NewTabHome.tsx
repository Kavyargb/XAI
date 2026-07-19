import {
  Box,
  Group,
  Text,
} from "@mantine/core";
import { useAtom, useSetAtom } from "jotai";
import { useState, useEffect } from "react";
import {
  activeTabAtom,
  sessionsAtom,
  tabsAtom,
  recentFilesAtom,
  type RecentFile,
} from "@/state/atoms";
import type { Tab } from "@/utils/tabs";
import CreateRepertoireModal from "./CreateRepertoireModal";
import ImportModal from "./ImportModal";
import classes from "./NewTabHome.module.css";
import {
  IconClock,
  IconFileImport,
  IconTargetArrow,
  IconPuzzle,
  IconBook,
  IconTrophy,
  IconChevronRight,
  IconArrowUpRight,
  IconTrash,
  IconFile,
} from "@tabler/icons-react";
import { useNavigate } from "@tanstack/react-router";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useTranslation } from "react-i18next";
import { openFile } from "@/utils/files";
import { getDatabases, query_players, type SuccessDatabaseInfo } from "@/utils/db";
import { getTimeControl } from "@/utils/timeControl";
import { commands } from "@/bindings";
import { unwrap } from "@/utils/unwrap";

dayjs.extend(relativeTime);

// Mock Recent Files for fallback
const mockRecentFiles: RecentFile[] = [
  {
    name: "Slav Defense",
    path: "Slav Defense.pgn",
    type: "repertoire",
    lastOpened: Date.now() - 3600000 * 2,
  },
  {
    name: "QueenBee vs ShadowMaster",
    path: "queen_vs_shadow.pgn",
    type: "game",
    lastOpened: Date.now() - 3600000 * 24,
  },
  {
    name: "Tactics Training",
    path: "puzzles.db3",
    type: "puzzle",
    lastOpened: Date.now() - 3600000 * 48,
  },
  {
    name: "London System",
    path: "London System.pgn",
    type: "repertoire",
    lastOpened: Date.now() - 3600000 * 72,
  },
];

interface RatingCardProps {
  id: string;
  label: string;
  value: number;
  change: number;
  icon: React.ReactNode;
  color: string;
  pathD: string;
}

function RatingCard({ id, label, value, change, icon, color, pathD }: RatingCardProps) {
  const isPositive = change >= 0;
  return (
    <Box className={classes.ratingCard} style={{ "--card-accent": color } as React.CSSProperties}>
      <div className={classes.ratingInfo}>
        <div className={classes.ratingHeader}>
          <Box className={classes.ratingIcon} style={{ color }}>
            {icon}
          </Box>
          <Text className={classes.ratingLabel}>{label}</Text>
        </div>
        <Text className={classes.ratingValueText}>{value}</Text>
        <div className={classes.ratingTrendWrapper}>
          <span className={`${classes.trendBadge} ${isPositive ? classes.trendUp : classes.trendDown}`}>
            {isPositive ? `▲ ${change}` : `▼ ${Math.abs(change)}`}
          </span>
        </div>
      </div>

      {/* Glowing SVG mini chart with draw-on animation */}
      <svg className={classes.chartContainer} viewBox="0 0 90 50">
        <defs>
          <filter id={`glow-${id}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          filter={`url(#glow-${id})`}
          className={classes.chartPath}
        />
      </svg>
    </Box>
  );
}

const generatePathFromHistory = (history: number[], defaultPath: string) => {
  if (!history || history.length < 2) return defaultPath;
  const min = Math.min(...history);
  const max = Math.max(...history);
  const range = max - min || 10;
  const width = 80;
  const height = 30;
  const paddingX = 5;
  const paddingY = 10;
  const points = history.map((val, idx) => {
    const x = paddingX + (idx / (history.length - 1)) * width;
    const y = paddingY + height - ((val - min) / range) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return `M ${points.join(" L ")}`;
};

export default function NewTabHome({ id }: { id: string }) {
  const { t } = useTranslation();

  const [openModal, setOpenModal] = useState(false);
  const [openRepertoireModal, setOpenRepertoireModal] = useState(false);
  const [, setTabs] = useAtom(tabsAtom);
  const setActiveTab = useSetAtom(activeTabAtom);
  const [recentFiles, setRecentFiles] = useAtom(recentFilesAtom);

  const [sessions] = useAtom(sessionsAtom);
  const navigate = useNavigate();

  const [ratingHistories, setRatingHistories] = useState<{
    rapid: number[];
    blitz: number[];
    classical: number[];
  }>({
    rapid: [],
    blitz: [],
    classical: [],
  });

  // Query databases to load the real rating histories for users
  useEffect(() => {
    async function loadRatingHistories() {
      try {
        const databases = await getDatabases();
        const successDbs = databases.filter(
          (db): db is SuccessDatabaseInfo => db.type === "success"
        );

        const rapidPoints: { date: number; elo: number }[] = [];
        const blitzPoints: { date: number; elo: number }[] = [];
        const classicalPoints: { date: number; elo: number }[] = [];

        for (const db of successDbs) {
          const session = sessions.find((s) => {
            const username = s.lichess?.username || s.chessCom?.username;
            return username && db.filename.includes(username);
          });
          const username = session?.lichess?.username || session?.chessCom?.username;
          if (!username) continue;

          const players = await query_players(db.file, {
            name: username,
            options: {
              pageSize: 1,
              direction: "asc",
              sort: "id",
              skipCount: false,
            },
          });
          if (players.data.length === 0) continue;
          const player = players.data[0];
          const info = unwrap(await commands.getPlayersGameInfo(db.file, player.id));
          
          if (info && info.site_stats_data) {
            for (const siteStats of info.site_stats_data) {
              const site = siteStats.site;
              for (const game of siteStats.data) {
                const speed = getTimeControl(site, game.time_control);
                const date = dayjs(game.date, "YYYY.MM.DD").valueOf();
                if (speed === "rapid") {
                  rapidPoints.push({ date, elo: game.player_elo });
                } else if (speed === "blitz") {
                  blitzPoints.push({ date, elo: game.player_elo });
                } else if (speed === "classical" || speed === "daily") {
                  classicalPoints.push({ date, elo: game.player_elo });
                }
              }
            }
          }
        }

        const processPoints = (points: { date: number; elo: number }[]) => {
          if (points.length === 0) return [];
          const map = new Map<number, number>();
          for (const p of points) {
            if (!map.has(p.date) || map.get(p.date)! < p.elo) {
              map.set(p.date, p.elo);
            }
          }
          return Array.from(map.entries())
            .sort((a, b) => a[0] - b[0])
            .map((entry) => entry[1]);
        };

        setRatingHistories({
          rapid: processPoints(rapidPoints),
          blitz: processPoints(blitzPoints),
          classical: processPoints(classicalPoints),
        });
      } catch (err) {
        console.error("Failed to load database ratings history", err);
      }
    }
    loadRatingHistories();
  }, []);

  // Fetch active account ratings or default mockup values
  let rapidRating = 2420;
  let rapidChange = 18;
  let blitzRating = 2350;
  let blitzChange = 12;
  let classicalRating = 2280;
  let classicalChange = 7;
  let puzzlesRating = 2450;
  let puzzlesChange = 30;

  const chessComSession = sessions.find((s) => s.chessCom);
  const lichessSession = sessions.find((s) => s.lichess);

  // Prioritize Chess.com for Rapid, Blitz, Daily (Classical)
  if (chessComSession?.chessCom?.stats) {
    const stats = chessComSession.chessCom.stats;
    if (stats.chess_rapid) {
      rapidRating = stats.chess_rapid.last.rating;
    }
    if (stats.chess_blitz) {
      blitzRating = stats.chess_blitz.last.rating;
    }
    if (stats.chess_daily) {
      classicalRating = stats.chess_daily.last.rating;
    }
  } else if (lichessSession?.lichess?.account) {
    const perfs = lichessSession.lichess.account.perfs;
    if (perfs) {
      if (perfs.rapid) {
        rapidRating = perfs.rapid.rating;
        rapidChange = perfs.rapid.prog;
      }
      if (perfs.blitz) {
        blitzRating = perfs.blitz.rating;
        blitzChange = perfs.blitz.prog;
      }
      if (perfs.classical) {
        classicalRating = perfs.classical.rating;
        classicalChange = perfs.classical.prog;
      }
    }
  }

  // Get Puzzles rating from Lichess session per user request
  if (lichessSession?.lichess?.account?.perfs?.puzzle) {
    const puzzlePerf = lichessSession.lichess.account.perfs.puzzle;
    puzzlesRating = puzzlePerf.rating;
    puzzlesChange = puzzlePerf.prog;
  }

  const finalRecentFiles = recentFiles.length > 0 ? recentFiles : mockRecentFiles;

  const handlePlayNow = () => {
    setTabs((prev: Tab[]) => {
      const tab = prev.find((t) => t.value === id);
      if (!tab) return prev;
      tab.name = t("Home.NewGame");
      tab.type = "play";
      return [...prev];
    });
  };

  const handleOpenAnalysis = () => {
    setTabs((prev: Tab[]) => {
      const tab = prev.find((t) => t.value === id);
      if (!tab) return prev;
      tab.name = t("Home.Card.AnalysisBoard.Title");
      tab.type = "analysis";
      return [...prev];
    });
  };

  const handleOpenPuzzles = () => {
    setTabs((prev: Tab[]) => {
      const tab = prev.find((t) => t.value === id);
      if (!tab) return prev;
      tab.name = t("Home.PuzzleTraining");
      tab.type = "puzzles";
      return [...prev];
    });
  };

  const handleRemoveFile = (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    setRecentFiles((prev) => prev.filter((f) => f.path !== path));
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "repertoire":
        return <IconBook size="1.1rem" />;
      case "game":
        return <IconFile size="1.1rem" />;
      case "puzzle":
        return <IconPuzzle size="1.1rem" />;
      case "tournament":
        return <IconTrophy size="1.1rem" />;
      default:
        return <IconFileImport size="1.1rem" />;
    }
  };

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  // Time-of-day greeting
  const hour = new Date().getHours();
  let greetingPrefix = "Good morning";
  let greetingEmoji = "☀️";
  if (hour >= 12 && hour < 17) {
    greetingPrefix = "Good afternoon";
    greetingEmoji = "🌤️";
  } else if (hour >= 17 && hour < 21) {
    greetingPrefix = "Good evening";
    greetingEmoji = "🌅";
  } else if (hour >= 21 || hour < 5) {
    greetingPrefix = "Good night";
    greetingEmoji = "🌙";
  }

  const activePlayerName =
    chessComSession?.chessCom?.username ||
    lichessSession?.lichess?.username ||
    sessions[0]?.player ||
    "Player";

  return (
    <>
      <ImportModal
        openModal={openModal}
        setOpenModal={setOpenModal}
        setTabs={setTabs}
        setActiveTab={setActiveTab}
      />
      <CreateRepertoireModal opened={openRepertoireModal} setOpened={setOpenRepertoireModal} />

      <div className={classes.container}>
        {/* Greeting */}
        <div className={classes.greetingSection}>
          <div className={classes.greetingText}>
            {greetingPrefix}, {activePlayerName}
            <span className={classes.greetingEmoji}>{greetingEmoji}</span>
          </div>
          <div className={classes.greetingSubtext}>Ready for your next move?</div>
        </div>

        {/* Top Ratings Grid Dashboard */}
        <div className={classes.ratingsGrid}>
          <RatingCard
            id="rapid"
            label="Rapid"
            value={rapidRating}
            change={rapidChange}
            icon={<IconTargetArrow size="1.25rem" />}
            color="#ff007f"
            pathD={generatePathFromHistory(ratingHistories.rapid, "M 5,38 Q 20,28 45,32 T 85,8")}
          />
          <RatingCard
            id="blitz"
            label="Blitz"
            value={blitzRating}
            change={blitzChange}
            icon={<IconClock size="1.25rem" />}
            color="#00b4d8"
            pathD={generatePathFromHistory(ratingHistories.blitz, "M 5,42 Q 25,12 48,26 T 85,14")}
          />
          <RatingCard
            id="classical"
            label="Classical"
            value={classicalRating}
            change={classicalChange}
            icon={<IconTrophy size="1.25rem" />}
            color="#2ecc71"
            pathD={generatePathFromHistory(ratingHistories.classical, "M 5,30 Q 30,35 50,18 T 85,10")}
          />
          <RatingCard
            id="puzzles"
            label="Puzzles"
            value={puzzlesRating}
            change={puzzlesChange}
            icon={<IconPuzzle size="1.25rem" />}
            color="#9b59b6"
            pathD={generatePathFromHistory(
              [puzzlesRating - 30, puzzlesRating - 10, puzzlesRating - 20, puzzlesRating],
              "M 5,40 Q 25,38 48,22 T 85,6"
            )}
          />
        </div>

        {/* Main Columns Grid Layout */}
        <div className={classes.mainGrid}>
          {/* Left Column: Hero Play Banner & Quick Action Grid */}
          <div>
            <div className={classes.heroCard}>
              <img
                src="/chess_hero_banner.png"
                alt=""
                className={classes.heroBgImage}
              />
              <div className={classes.heroOverlay} />
              <div className={classes.heroContent}>
                <h2 className={classes.heroTitle}>Play Chess</h2>
                <p className={classes.heroDesc}>
                  Start a new game and challenge the world
                </p>
                <button className={classes.playBtn} onClick={handlePlayNow}>
                  <span className={classes.liveDot} />
                  Play Now <IconChevronRight size="1.1rem" />
                </button>
              </div>
            </div>

            {/* Bottom Grid of Four Cards */}
            <div className={classes.quickActionsGrid}>
              <div
                className={`${classes.actionCard} ${classes.cyanGlow}`}
                onClick={handleOpenAnalysis}
              >
                <div className={classes.actionCardHeader}>
                  <div>
                    <h3 className={classes.actionTitle}>Analysis Board</h3>
                    <p className={classes.actionDesc}>
                      Review your games with powerful tools
                    </p>
                  </div>
                  <IconChevronRight className={classes.actionArrow} size="1.25rem" />
                </div>
              </div>

              <div
                className={`${classes.actionCard} ${classes.purpleGlow}`}
                onClick={handleOpenPuzzles}
              >
                <div className={classes.actionCardHeader}>
                  <div>
                    <h3 className={classes.actionTitle}>Puzzles</h3>
                    <p className={classes.actionDesc}>
                      Train your tactics and improve
                    </p>
                  </div>
                  <IconChevronRight className={classes.actionArrow} size="1.25rem" />
                </div>
              </div>

              <div
                className={`${classes.actionCard} ${classes.greenGlow}`}
                onClick={() => setOpenRepertoireModal(true)}
              >
                <div className={classes.actionCardHeader}>
                  <div>
                    <h3 className={classes.actionTitle}>New Repertoire</h3>
                    <p className={classes.actionDesc}>
                      Build and explore your openings
                    </p>
                  </div>
                  <IconChevronRight className={classes.actionArrow} size="1.25rem" />
                </div>
              </div>

              <div
                className={`${classes.actionCard} ${classes.orangeGlow}`}
                onClick={() => setOpenModal(true)}
              >
                <div className={classes.actionCardHeader}>
                  <div>
                    <h3 className={classes.actionTitle}>Import Game</h3>
                    <p className={classes.actionDesc}>
                      Import PGN files and analyze
                    </p>
                  </div>
                  <IconChevronRight className={classes.actionArrow} size="1.25rem" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Recent Files */}
          <div className={classes.recentGamesContainer}>
            <div className={classes.panelHeader}>
              <h3 className={classes.panelTitle}>Recent Files</h3>
              <Text className={classes.viewAllLink} onClick={() => navigate({ to: "/files" })}>
                View All
              </Text>
            </div>

            <div className={classes.recentGamesList}>
              {finalRecentFiles.map((file, idx) => (
                <div
                  key={idx}
                  className={classes.gameRow}
                  onClick={() => openFile(file.path, setTabs, setActiveTab)}
                  style={{ cursor: "pointer" }}
                >
                  <div className={classes.playerInfo}>
                    <Box className={classes.gameAvatar}>
                      {getFileIcon(file.type)}
                    </Box>
                    <div className={classes.namesCol}>
                      <span className={classes.opponentName}>{file.name}</span>
                      <span className={classes.opponentRating}>
                        {capitalize(file.type)}
                      </span>
                    </div>
                  </div>

                  <div className={classes.outcomeSection}>
                    <Group gap="xs">
                      <span className={classes.gameMetaText}>
                        {dayjs(file.lastOpened).fromNow()}
                      </span>
                      {recentFiles.some((f) => f.path === file.path) && (
                        <span
                          className={classes.viewAllLink}
                          onClick={(e) => handleRemoveFile(e, file.path)}
                          style={{ display: "inline-flex", color: "#e74c3c" }}
                        >
                          <IconTrash size="0.95rem" />
                        </span>
                      )}
                    </Group>
                  </div>
                </div>
              ))}
            </div>

            <div className={classes.recentGamesFooter}>
              <button className={classes.footerButton} onClick={() => navigate({ to: "/files" })}>
                View All Files <IconArrowUpRight size="0.95rem" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
