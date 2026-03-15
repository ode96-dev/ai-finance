import React from "react";
import {
    BarChart3,
    Receipt,
    PieChart,
    CreditCard,
    Globe,
    Zap,
} from "lucide-react";

export type StatItem = {
    value: string;
    label: string;
};

export const statsData: StatItem[] = [
    {
        value: "50K+",
        label: "Active Users",
    },
    {
        value: "$2B+",
        label: "Transactions Tracked",
    },
    {
        value: "99.9%",
        label: "Uptime",
    },
    {
        value: "4.9/5",
        label: "User Rating",
    },
];

export type FeatureItem = {
    icon: React.ReactNode;
    title: string;
    description: string;
};

// Features Data
export const featuresData: FeatureItem[] = [
    {
        icon: React.createElement(BarChart3, {
            className: "h-8 w-8 text-blue-600",
        }),
        title: "Advanced Analytics",
        description:
            "Get detailed insights into your spending patterns with AI-powered analytics",
    },
    {
        icon: React.createElement(Receipt, {
            className: "h-8 w-8 text-blue-600",
        }),
        title: "Smart Receipt Scanner",
        description:
            "Extract data automatically from receipts using advanced AI technology",
    },
    {
        icon: React.createElement(PieChart, {
            className: "h-8 w-8 text-blue-600",
        }),
        title: "Budget Planning",
        description: "Create and manage budgets with intelligent recommendations",
    },
    {
        icon: React.createElement(CreditCard, {
            className: "h-8 w-8 text-blue-600",
        }),
        title: "Multi-Account Support",
        description: "Manage multiple accounts and credit cards in one place",
    },
    {
        icon: React.createElement(Globe, {
            className: "h-8 w-8 text-blue-600",
        }),
        title: "Multi-Currency",
        description: "Support for multiple currencies with real-time conversion",
    },
    {
        icon: React.createElement(Zap, {
            className: "h-8 w-8 text-blue-600",
        }),
        title: "Automated Insights",
        description: "Get automated financial insights and recommendations",
    },
];

export type HowItWorksItem = {
    icon: React.ReactNode;
    title: string;
    description: string;
};

// How It Works Data
export const howItWorksData: HowItWorksItem[] = [
    {
        icon: React.createElement(CreditCard, {
            className: "h-8 w-8 text-blue-600",
        }),
        title: "1. Create Your Account",
        description:
            "Get started in minutes with our simple and secure sign-up process",
    },
    {
        icon: React.createElement(BarChart3, {
            className: "h-8 w-8 text-blue-600",
        }),
        title: "2. Track Your Spending",
        description:
            "Automatically categorize and track your transactions in real-time",
    },
    {
        icon: React.createElement(PieChart, {
            className: "h-8 w-8 text-blue-600",
        }),
        title: "3. Get Insights",
        description:
            "Receive AI-powered insights and recommendations to optimize your finances",
    },
];

export type TestimonialItem = {
    name: string;
    role: string;
    image: string;
    quote: string;
};

// Testimonials Data
export const testimonialsData: TestimonialItem[] = [
    {
        name: "Sarah Johnson",
        role: "Small Business Owner",
        image: "https://randomuser.me/api/portraits/women/75.jpg",
        quote:
            "Welth has transformed how I manage my business finances. The AI insights have helped me identify cost-saving opportunities I never knew existed.",
    },
    {
        name: "Michael Chen",
        role: "Freelancer",
        image: "https://randomuser.me/api/portraits/men/75.jpg",
        quote:
            "The receipt scanning feature saves me hours each month. Now I can focus on my work instead of manual data entry and expense tracking.",
    },
    {
        name: "Emily Rodriguez",
        role: "Financial Advisor",
        image: "https://randomuser.me/api/portraits/women/74.jpg",
        quote:
            "I recommend Welth to all my clients. The multi-currency support and detailed analytics make it perfect for international investors.",
    },
];