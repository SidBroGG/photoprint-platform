"use client";

import Image from "next/image";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import type { DemoAccount } from "@/lib/auth/roles";
import { login } from "@/app/actions/auth";

export function LoginView({ accounts }: { accounts: DemoAccount[] }) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #FFF9DB 0px, #F5F6F8 260px, #F5F6F8 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        py: { xs: 4, md: 6 },
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 1120 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
          <Image src="/logo.png" alt="ФотоПринт" width={46} height={46} priority />
          <Box>
            <Typography sx={{ fontSize: 22, fontWeight: 700, lineHeight: 1.2 }}>
              ФотоПринт · Платформа управления
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Единое окно по продажам, финансам, производству, логистике и сервису
            </Typography>
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 760 }}>
          Демо-доступ без пароля. Выберите аккаунт: каждая роль видит только свои разделы,
          а данные и права проверяются на сервере.
        </Typography>

        <Box className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <Card key={account.id} sx={{ display: "flex", flexDirection: "column" }}>
              <CardContent sx={{ display: "flex", flexDirection: "column", flexGrow: 1, p: 2.5 }}>
                <Typography sx={{ fontSize: 16, fontWeight: 700 }}>{account.name}</Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "warning.main", fontWeight: 600, mt: 0.25, minHeight: 38 }}
                >
                  {account.roleLabel}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, flexGrow: 1 }}>
                  {account.description}
                </Typography>
                <Box component="form" action={login} sx={{ mt: 2.25 }}>
                  <input type="hidden" name="accountId" value={account.id} />
                  <Button type="submit" variant="contained" fullWidth>
                    Войти
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 3 }}>
          Демо-стенд на детерминированных мок-данных. Реальные интеграции и пароли не используются.
        </Typography>
      </Box>
    </Box>
  );
}
