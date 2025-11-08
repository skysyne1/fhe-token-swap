import "@rainbow-me/rainbowkit/styles.css";
import { DiceGameWrapper } from "~~/components/DiceGameWrapper";
import { ThemeProvider } from "~~/components/ThemeProvider";
import "~~/styles/globalsDiceGame.css";
import "~~/styles/indexDiceGame.css";
import { getMetadata } from "~~/utils/helper/getMetadata";

export const metadata = getMetadata({
  title: "Zama Template",
  description: "Built with FHEVM",
});

const DappWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <html suppressHydrationWarning className={``}>
      <head>
        <link href="https://api.fontshare.com/v2/css?f[]=telegraf@400,500,700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <ThemeProvider enableSystem>
          <DiceGameWrapper>{children}</DiceGameWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
};

export default DappWrapper;
