"use client";

import { useState } from "react";
import NextLink from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import Avatar from "@mui/material/Avatar";
import ButtonBase from "@mui/material/ButtonBase";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardOutlined from "@mui/icons-material/DashboardOutlined";
import ReceiptLongOutlined from "@mui/icons-material/ReceiptLongOutlined";
import GroupsOutlined from "@mui/icons-material/GroupsOutlined";
import PhotoAlbumOutlined from "@mui/icons-material/PhotoAlbumOutlined";
import PrecisionManufacturingOutlined from "@mui/icons-material/PrecisionManufacturingOutlined";
import LocalShippingOutlined from "@mui/icons-material/LocalShippingOutlined";
import SupportAgentOutlined from "@mui/icons-material/SupportAgentOutlined";
import PeopleAltOutlined from "@mui/icons-material/PeopleAltOutlined";
import TrendingUpOutlined from "@mui/icons-material/TrendingUpOutlined";
import LogoutOutlined from "@mui/icons-material/LogoutOutlined";
import type { ReactNode } from "react";
import type { NavItem } from "@/lib/auth/roles";
import { logout } from "@/app/actions/auth";

const DRAWER_WIDTH = 248;

const ICONS: Record<string, ReactNode> = {
  dashboard: <DashboardOutlined />,
  orders: <ReceiptLongOutlined />,
  customers: <GroupsOutlined />,
  products: <PhotoAlbumOutlined />,
  production: <PrecisionManufacturingOutlined />,
  logistics: <LocalShippingOutlined />,
  service: <SupportAgentOutlined />,
  personnel: <PeopleAltOutlined />,
  forecast: <TrendingUpOutlined />,
};

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("");
}

export function AppShell({
  account,
  navItems,
  children,
}: {
  account: { name: string; roleLabel: string };
  navItems: NavItem[];
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const activeItem = navItems
    .slice()
    .sort((a, b) => b.href.length - a.href.length)
    .find(
      (item) =>
        pathname === item.href ||
        (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`)),
    );
  const pageTitle = activeItem?.label ?? "Платформа";

  const drawer = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Box sx={{ px: 2.5, pt: 2.5, pb: 2, display: "flex", alignItems: "center", gap: 1.25 }}>
        <Image src="/logo.png" alt="ФотоПринт" width={38} height={38} priority />
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>
            ФотоПринт
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.3 }}>
            Платформа управления
          </Typography>
        </Box>
      </Box>
      <Divider />
      <List sx={{ px: 1.25, py: 1.5, flexGrow: 1 }}>
        {navItems.map((item) => {
          const selected =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
          return (
            <ListItemButton
              key={item.href}
              component={NextLink}
              href={item.href}
              selected={selected}
              onClick={() => setMobileOpen(false)}
              sx={{
                borderRadius: 0.5,
                mb: 0.25,
                minHeight: 42,
                borderLeft: "3px solid transparent",
                pl: 1.25,
                "&.Mui-selected": {
                  backgroundColor: "#FFF4C2",
                  borderLeftColor: "primary.main",
                  "&:hover": { backgroundColor: "#FFF0AE" },
                },
                "&.Mui-selected .MuiListItemText-primary": { fontWeight: 600 },
                "&.Mui-selected .MuiListItemIcon-root": { color: "#1A1A1A" },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: "#5F6570" }}>
                {ICONS[item.icon]}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{ fontSize: 14 }}
              />
            </ListItemButton>
          );
        })}
      </List>
      <Box sx={{ px: 2.5, py: 2, borderTop: "1px solid #E3E6EB" }}>
        <Typography variant="caption" color="text.secondary">
          Демо-режим · мок-данные
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
        aria-label="Основная навигация"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": { width: DRAWER_WIDTH, borderRight: "1px solid #E3E6EB" },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              width: DRAWER_WIDTH,
              borderRight: "1px solid #E3E6EB",
              backgroundColor: "#FFFFFF",
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box sx={{ flexGrow: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <AppBar
          position="sticky"
          color="inherit"
          elevation={0}
          sx={{
            backgroundColor: "rgba(255,255,255,0.96)",
            backdropFilter: "blur(6px)",
            borderBottom: "1px solid #E3E6EB",
          }}
        >
          <Toolbar sx={{ minHeight: 64, gap: 1.5 }}>
            <IconButton
              edge="start"
              onClick={() => setMobileOpen(true)}
              sx={{ display: { md: "none" } }}
              aria-label="Открыть меню"
            >
              <MenuIcon />
            </IconButton>
            <Typography sx={{ fontSize: 17, fontWeight: 700, flexGrow: 1 }}>
              {pageTitle}
            </Typography>
            <ButtonBase
              onClick={(event) => setMenuAnchor(event.currentTarget)}
              sx={{ borderRadius: 0.5, px: 1, py: 0.5, gap: 1 }}
              aria-label="Меню пользователя"
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  backgroundColor: "primary.main",
                  color: "#1A1A1A",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                {initials(account.name)}
              </Avatar>
              <Box sx={{ textAlign: "left", display: { xs: "none", sm: "block" } }}>
                <Typography sx={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.25 }}>
                  {account.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.25 }}>
                  {account.roleLabel}
                </Typography>
              </Box>
            </ButtonBase>
            <Menu
              anchorEl={menuAnchor}
              open={Boolean(menuAnchor)}
              onClose={() => setMenuAnchor(null)}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
            >
              <Box sx={{ px: 2, py: 1, minWidth: 240 }}>
                <Typography sx={{ fontSize: 13.5, fontWeight: 600 }}>
                  {account.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {account.roleLabel}
                </Typography>
              </Box>
              <Divider />
              <Box component="form" action={logout}>
                <MenuItem component="button" type="submit" sx={{ width: "100%", gap: 1 }}>
                  <LogoutOutlined fontSize="small" />
                  Выйти
                </MenuItem>
              </Box>
            </Menu>
          </Toolbar>
        </AppBar>

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            px: { xs: 2, sm: 2.5, md: 3.5 },
            py: { xs: 2.5, md: 3 },
            width: "100%",
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
