import type { Config } from "tailwindcss";

export default {
    darkMode: "class", // Changed from ["class"] to "class"
    content: [
        "./src/**/*.{ts,tsx,js,jsx}",
        "./app/**/*.{ts,tsx,js,jsx}",
    ],
    prefix: "",
    theme: {
        container: {
            center: true,
            padding: "2rem",
            screens: {
                "2xl": "1400px",
            },
        },
        extend: {
            fontFamily: {
                'sans': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
            },
            colors: {
                border: "#E4E7EB",
                input: "#F5F7FA",
                ring: "hsl(var(--ring))",
                background: "#FFFFFF",
                foreground: "#121619",
                primary: {
                    DEFAULT: "#1E88E5",
                    foreground: "#FFFFFF",
                    50: "#E3F2FD",
                    100: "#BBDEFB",
                    200: "#90CAF9",
                    300: "#64B5F6",
                    400: "#42A5F5",
                    500: "#1E88E5",
                    600: "#1976D2",
                    700: "#1565C0",
                    800: "#0D47A1",
                    900: "#0277BD",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                muted: {
                    DEFAULT: "#F5F7FA",
                    foreground: "#6C737F",
                },
                accent: {
                    DEFAULT: "#FFC107",
                    foreground: "#000000",
                    alt: "hsl(var(--accent))",
                    "alt-foreground": "hsl(var(--accent-foreground))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                card: {
                    DEFAULT: "#FFFFFF",
                    foreground: "#121619",
                },
                sidebar: {
                    DEFAULT: "hsl(var(--sidebar-background))",
                    foreground: "hsl(var(--sidebar-foreground))",
                    primary: "hsl(var(--sidebar-primary))",
                    "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
                    accent: "hsl(var(--sidebar-accent))",
                    "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
                    border: "hsl(var(--sidebar-border))",
                    ring: "hsl(var(--sidebar-ring))",
                },
                gray: {
                    50: "#F5F7FA",
                    100: "#E4E7EB",
                    200: "#C1C7CD",
                    300: "#9AA0A6",
                    400: "#6C737F",
                    500: "#4E5D6C",
                    600: "#394452",
                    700: "#212934",
                    800: "#121619",
                    900: "#0D0F10",
                },
                success: {
                    DEFAULT: "hsl(142 76% 36%)",
                    foreground: "hsl(0 0% 100%)",
                },
                warning: {
                    DEFAULT: "hsl(38 92% 50%)",
                    foreground: "hsl(0 0% 100%)",
                },
                info: {
                    DEFAULT: "hsl(199 89% 48%)",
                    foreground: "hsl(0 0% 100%)",
                },
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            boxShadow: {
                'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            },
            keyframes: {
                "accordion-down": {
                    from: {
                        height: "0",
                    },
                    to: {
                        height: "var(--radix-accordion-content-height)",
                    },
                },
                "accordion-up": {
                    from: {
                        height: "var(--radix-accordion-content-height)",
                    },
                    to: {
                        height: "0",
                    },
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
} satisfies Config;