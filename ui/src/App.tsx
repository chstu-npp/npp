import * as React from "react";
import { BrowserRouter, Link, Route, Routes, useLocation } from "react-router-dom";

import { ThemeProvider, useTheme } from "next-themes";

import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { format } from "date-fns";

import { Toaster, toast } from "sonner";

import { Drawer } from "vaul";

import { cva } from "class-variance-authority";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import { OTPInput, type SlotProps, REGEXP_ONLY_DIGITS } from "input-otp";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip as RechartsTooltip,
    CartesianGrid,
    ResponsiveContainer,
} from "recharts";

import { DayPicker } from "react-day-picker";

import * as Resizable from "react-resizable-panels";

// Radix imports (explicitly prove installation)
import * as Accordion from "@radix-ui/react-accordion";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import * as AspectRatio from "@radix-ui/react-aspect-ratio";
import * as Avatar from "@radix-ui/react-avatar";
import * as Checkbox from "@radix-ui/react-checkbox";
import * as ContextMenu from "@radix-ui/react-context-menu";
import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as HoverCard from "@radix-ui/react-hover-card";
import * as Label from "@radix-ui/react-label";
import * as Menubar from "@radix-ui/react-menubar";
import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import * as Popover from "@radix-ui/react-popover";
import * as Progress from "@radix-ui/react-progress";
import * as RadioGroup from "@radix-ui/react-radio-group";
import * as ScrollArea from "@radix-ui/react-scroll-area";
import * as Select from "@radix-ui/react-select";
import * as Separator from "@radix-ui/react-separator";
import * as Slider from "@radix-ui/react-slider";
import { Slot } from "@radix-ui/react-slot";
import * as Switch from "@radix-ui/react-switch";
import * as Tabs from "@radix-ui/react-tabs";
import * as Toast from "@radix-ui/react-toast";
import * as Toggle from "@radix-ui/react-toggle";
import * as ToggleGroup from "@radix-ui/react-toggle-group";
import * as Tooltip from "@radix-ui/react-tooltip";

import {
    Home,
    Users,
    FilePlus2,
    ChartLine,
    SlidersHorizontal,
    Sun,
    Moon,
    Search,
    Check,
    X,
    ChevronDown,
    ShieldCheck,
} from "lucide-react";

/* ------------------ utils ------------------ */
function cn(...inputs: Array<string | undefined | null | false>) {
    return twMerge(clsx(inputs));
}

function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
}

/* ------------------ CVA: status badge ------------------ */
const badgeVariants = cva(
    "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium border",
    {
        variants: {
            intent: {
                neutral: "border-zinc-300 text-zinc-800 dark:border-zinc-700 dark:text-zinc-100",
                success: "border-emerald-300 text-emerald-800 dark:border-emerald-800 dark:text-emerald-200",
                danger: "border-rose-300 text-rose-800 dark:border-rose-800 dark:text-rose-200",
                warning: "border-amber-300 text-amber-900 dark:border-amber-800 dark:text-amber-200",
            },
        },
        defaultVariants: { intent: "neutral" },
    }
);

/* ------------------ Slot demo ------------------ */
type SlotButtonProps = React.ComponentPropsWithoutRef<"button"> & { asChild?: boolean };
function SlotButton({ asChild, className, children, ...rest }: SlotButtonProps) {
    const Comp = asChild ? Slot : "button";
    return (
        <Comp
            className={cn(
                "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm border",
                "bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800",
                "disabled:opacity-60 disabled:cursor-not-allowed",
                className
            )}
            {...rest}
        >
            {children}
        </Comp>
    );
}

/* ------------------ NPP-ish fake API ------------------ */
type WorksType = "SCIENCE" | "METHOD" | "ORG";

type Teacher = {
    id: string;
    fullName: string;
    department: string;
    position: string;
    email: string;
    rating: { total: number; science: number; method: number; org: number };
};

const TEACHERS: Teacher[] = [
    {
        id: "t-101",
        fullName: "Oleksii Koliavatov",
        department: "Computer Engineering",
        position: "Associate Professor",
        email: "koliavatov@stu.cn.ua",
        rating: { total: 182, science: 42, method: 96, org: 44 },
    },
    {
        id: "t-102",
        fullName: "Maksym (Dept. Staff)",
        department: "Computer Engineering",
        position: "Senior Lecturer",
        email: "maksym@stu.cn.ua",
        rating: { total: 141, science: 33, method: 73, org: 35 },
    },
    {
        id: "t-103",
        fullName: "Anna Ackerman",
        department: "Information Systems",
        position: "Lecturer",
        email: "ackerman@stu.cn.ua",
        rating: { total: 119, science: 18, method: 71, org: 30 },
    },
];

async function apiGetMe() {
    await sleep(200);
    return {
        id: "me-001",
        fullName: "Denys Lysenok",
        email: "cerobocka@stu.cn.ua",
        department: "Computer Engineering",
        role: "Teacher",
    };
}

async function apiGetSystemReadOnly() {
    await sleep(150);
    return { readOnly: false, reason: null as null | string };
}

async function apiSearchTeachers(params: { query: string; department?: string }) {
    await sleep(250);
    const q = params.query.trim().toLowerCase();

    let out = TEACHERS.filter(
        (t) =>
            t.fullName.toLowerCase().includes(q) ||
            t.email.toLowerCase().includes(q) ||
            t.department.toLowerCase().includes(q)
    );

    if (params.department && params.department !== "all") {
        out = out.filter((t) => t.department === params.department);
    }

    return out;
}

async function apiGetTeacherTimeseries(params: {
    teacherId: string;
    yearFrom: number;
    yearTo: number;
    types: WorksType[];
}) {
    await sleep(250);
    const months = ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun"];

    const seed = params.teacherId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const typeWeight: Record<WorksType, number> = { SCIENCE: 0.7, METHOD: 1.0, ORG: 0.85 };
    const w = params.types.reduce((a, t) => a + typeWeight[t], 0) / Math.max(1, params.types.length);

    return months.map((m, i) => {
        const base = ((seed % 23) + i * 4) * w;
        return { month: m, points: Math.round(base) };
    });
}

/* ------------------ App bootstrap ------------------ */
const queryClient = new QueryClient();

export default function App() {
    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <QueryClientProvider client={queryClient}>
                <BrowserRouter>
                    <Toaster richColors />
                    <AppShell />
                </BrowserRouter>
            </QueryClientProvider>
        </ThemeProvider>
    );
}

function AppShell() {
    return (
        <div className="min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
            <Header />
            <main className="mx-auto max-w-6xl p-4">
                <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/directory" element={<DirectoryPage />} />
                    <Route path="/activity" element={<ActivityDraftPage />} />
                    <Route path="/analytics" element={<AnalyticsPage />} />
                    <Route path="/ui-lab" element={<UiLabPage />} />
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </main>
        </div>
    );
}

/* ------------------ Header ------------------ */
function Header() {
    const location = useLocation();
    const { theme, resolvedTheme, setTheme } = useTheme();

    const isDark = theme === "dark" || (theme === "system" && resolvedTheme === "dark");

    return (
        <div className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur dark:bg-zinc-950/80">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 p-4">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5" />
                    <div className="font-semibold">NPP UI — scenario smoke-test</div>
                    <span className={badgeVariants({ intent: "neutral" })}>route: {location.pathname}</span>
                </div>

                <nav className="flex flex-wrap items-center gap-2">
                    <NavLink to="/" icon={<Home className="h-4 w-4" />}>
                        Dashboard
                    </NavLink>
                    <NavLink to="/directory" icon={<Users className="h-4 w-4" />}>
                        Directory
                    </NavLink>
                    <NavLink to="/activity" icon={<FilePlus2 className="h-4 w-4" />}>
                        Activity
                    </NavLink>
                    <NavLink to="/analytics" icon={<ChartLine className="h-4 w-4" />}>
                        Analytics
                    </NavLink>
                    <NavLink to="/ui-lab" icon={<SlidersHorizontal className="h-4 w-4" />}>
                        UI Lab
                    </NavLink>

                    <SlotButton
                        type="button"
                        onClick={() => setTheme(isDark ? "light" : "dark")}
                        className="ml-2"
                        aria-label="Toggle theme"
                    >
                        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                        Theme
                    </SlotButton>
                </nav>
            </div>
        </div>
    );
}

function NavLink(props: { to: string; children: React.ReactNode; icon?: React.ReactNode }) {
    return (
        <Link
            to={props.to}
            className={cn(
                "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm border",
                "hover:bg-zinc-50 dark:hover:bg-zinc-800",
                "bg-white dark:bg-zinc-900"
            )}
        >
            {props.icon}
            {props.children}
        </Link>
    );
}

/* ------------------ Page: Dashboard ------------------ */
function DashboardPage() {
    const me = useQuery({
        queryKey: ["npp", "me"],
        queryFn: apiGetMe,
        staleTime: 30_000,
    });

    const readOnly = useQuery({
        queryKey: ["npp", "system", "read-only"],
        queryFn: apiGetSystemReadOnly,
        staleTime: 15_000,
    });

    const healthIntent =
        me.isError || readOnly.isError
            ? "danger"
            : me.isSuccess && readOnly.isSuccess
                ? readOnly.data.readOnly
                    ? "warning"
                    : "success"
                : "neutral";

    return (
        <section className="space-y-4">
            <h1 className="text-2xl font-semibold">Dashboard</h1>

            <div className="flex flex-wrap items-center gap-2">
        <span className={badgeVariants({ intent: healthIntent })}>
          API: {me.isLoading || readOnly.isLoading ? "loading" : me.isError || readOnly.isError ? "error" : "ok"}
        </span>
                <span className={badgeVariants({ intent: readOnly.data?.readOnly ? "warning" : "success" })}>
          System read-only: {readOnly.data?.readOnly ? "ON" : "OFF"}
        </span>
                <span className={badgeVariants({ intent: "neutral" })}>
          Local time: {format(new Date(), "yyyy-MM-dd HH:mm:ss")}
        </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border p-4 bg-white dark:bg-zinc-900">
                    <div className="text-sm text-zinc-500 dark:text-zinc-400">Current user (mock)</div>
                    <pre className="mt-2 overflow-auto rounded-md bg-zinc-50 p-3 text-xs dark:bg-zinc-950">
            {JSON.stringify(me.data ?? null, null, 2)}
          </pre>

                    <div className="mt-3 flex flex-wrap gap-2">
                        <SlotButton type="button" onClick={() => toast.success("Dashboard action (demo)")}>
                            <Check className="h-4 w-4" />
                            Trigger toast
                        </SlotButton>

                        <SlotButton type="button" onClick={() => toast.error("Example error toast (demo)")}>
                            <X className="h-4 w-4" />
                            Error toast
                        </SlotButton>
                    </div>
                </div>

                <div className="rounded-lg border p-4 bg-white dark:bg-zinc-900 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <div className="font-medium">Academic period (demo)</div>
                            <div className="text-sm text-zinc-500 dark:text-zinc-400">
                                Use other pages to validate directory, activity draft, analytics, and UI primitives.
                            </div>
                        </div>

                        <Drawer.Root>
                            <Drawer.Trigger asChild>
                                <SlotButton type="button">
                                    <ChevronDown className="h-4 w-4" />
                                    Quick filters
                                </SlotButton>
                            </Drawer.Trigger>

                            <Drawer.Portal>
                                <Drawer.Overlay className="fixed inset-0 bg-black/40" />
                                <Drawer.Content className="fixed bottom-0 left-0 right-0 outline-none">
                                    <div className="mx-auto max-w-3xl rounded-t-xl border bg-white p-4 dark:bg-zinc-950">
                                        <div className="font-semibold">Quick filters (drawer)</div>
                                        <div className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                                            Typical NPP filters: academic year / semester / works type.
                                        </div>

                                        <div className="mt-4 flex gap-2">
                                            <Drawer.Close asChild>
                                                <SlotButton type="button" onClick={() => toast("Drawer closed")}>
                                                    Close
                                                </SlotButton>
                                            </Drawer.Close>
                                            <SlotButton type="button" onClick={() => toast.success("Filters applied (demo)")}>
                                                Apply
                                            </SlotButton>
                                        </div>
                                    </div>
                                </Drawer.Content>
                            </Drawer.Portal>
                        </Drawer.Root>
                    </div>

                    <div className="rounded-md border p-3 bg-white dark:bg-zinc-950">
                        <div className="text-sm font-medium mb-2">Report window (DayPicker)</div>
                        <DayPicker mode="single" selected={new Date()} onSelect={() => {}} />
                    </div>
                </div>
            </div>
        </section>
    );
}

/* ------------------ Page: Directory ------------------ */
const DEPARTMENTS = ["all", "Computer Engineering", "Information Systems"] as const;

const DirectorySchema = z.object({
    query: z.string().min(2, "Enter at least 2 characters"),
    department: z.enum(DEPARTMENTS),
});
type DirectoryValues = z.infer<typeof DirectorySchema>;

function DirectoryPage() {
    const [searchParams, setSearchParams] = React.useState<DirectoryValues>({
        query: "Computer",
        department: "all",
    });

    const form = useForm<DirectoryValues>({
        resolver: zodResolver(DirectorySchema),
        defaultValues: searchParams,
        mode: "onChange",
    });

    const teachers = useQuery({
        queryKey: ["npp", "public", "teachers", searchParams.query, searchParams.department],
        queryFn: () => apiSearchTeachers({ query: searchParams.query, department: searchParams.department }),
        enabled: Boolean(searchParams.query),
    });

    const onSubmit = (values: DirectoryValues) => {
        setSearchParams(values);
        toast.success("Directory search executed");
    };

    return (
        <section className="space-y-4">
            <h2 className="text-xl font-semibold">Directory</h2>

            <div className="rounded-lg border p-4 bg-white dark:bg-zinc-900">
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3 md:flex-row md:items-end">
                    <div className="flex-1 grid gap-2">
                        <Label.Root className="text-sm font-medium">Teacher / email / department</Label.Root>

                        <div className="flex gap-2">
                            <input
                                className="w-full rounded-md border px-3 py-2 bg-white dark:bg-zinc-950"
                                placeholder="e.g. surname or @stu.cn.ua"
                                {...form.register("query")}
                            />
                            <SlotButton type="submit" disabled={!form.formState.isValid}>
                                <Search className="h-4 w-4" />
                                Search
                            </SlotButton>
                        </div>

                        {form.formState.errors.query && (
                            <div className="text-xs text-rose-600">{form.formState.errors.query.message}</div>
                        )}
                    </div>

                    <div className="grid gap-2 md:w-72">
                        <Label.Root className="text-sm font-medium">Department (Radix Select)</Label.Root>

                        <Select.Root
                            value={form.watch("department")}
                            onValueChange={(v) =>
                                form.setValue("department", v as DirectoryValues["department"], {
                                    shouldDirty: true,
                                    shouldValidate: true,
                                })
                            }
                        >
                            <Select.Trigger className="inline-flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm bg-white dark:bg-zinc-950">
                                <Select.Value />
                                <Select.Icon>
                                    <ChevronDown className="h-4 w-4" />
                                </Select.Icon>
                            </Select.Trigger>

                            <Select.Portal>
                                <Select.Content className="rounded-md border bg-white p-1 shadow dark:bg-zinc-950">
                                    {DEPARTMENTS.map((d) => (
                                        <Select.Item
                                            key={d}
                                            className="px-2 py-1 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900"
                                            value={d}
                                        >
                                            <Select.ItemText>{d}</Select.ItemText>
                                        </Select.Item>
                                    ))}
                                </Select.Content>
                            </Select.Portal>
                        </Select.Root>
                    </div>
                </form>
            </div>

            <div className="rounded-lg border overflow-hidden bg-white dark:bg-zinc-900">
                <div className="p-3 border-b text-sm text-zinc-500 dark:text-zinc-400">
                    react-resizable-panels v4 — hierarchy (left) / results (right)
                </div>

                <div className="h-[420px]">
                    <Resizable.Group className="h-full">
                        <Resizable.Panel defaultSize={30} minSize={20} className="p-3">
                            <div className="font-medium">Org hierarchy (mock)</div>

                            <div className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 space-y-2">
                                <div>Institute → Faculty → Department</div>

                                <div className={cn("rounded-md border p-2", "bg-white dark:bg-zinc-950")}>
                                    <div className="font-medium">Computer Engineering</div>
                                    <div className="text-xs opacity-75">2 teachers</div>
                                </div>

                                <div className={cn("rounded-md border p-2", "bg-white dark:bg-zinc-950")}>
                                    <div className="font-medium">Information Systems</div>
                                    <div className="text-xs opacity-75">1 teacher</div>
                                </div>
                            </div>

                            <div className="mt-4">
                                <Drawer.Root>
                                    <Drawer.Trigger asChild>
                                        <SlotButton type="button">
                                            <ChevronDown className="h-4 w-4" />
                                            Filters (drawer)
                                        </SlotButton>
                                    </Drawer.Trigger>

                                    <Drawer.Portal>
                                        <Drawer.Overlay className="fixed inset-0 bg-black/40" />
                                        <Drawer.Content className="fixed bottom-0 left-0 right-0 outline-none">
                                            <div className="mx-auto max-w-3xl rounded-t-xl border bg-white p-4 dark:bg-zinc-950">
                                                <div className="font-semibold">Directory filters</div>
                                                <div className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                                                    Typical filters: department, academic year, work type, rating threshold.
                                                </div>

                                                <div className="mt-4 flex gap-2">
                                                    <Drawer.Close asChild>
                                                        <SlotButton type="button">Close</SlotButton>
                                                    </Drawer.Close>
                                                    <SlotButton type="button" onClick={() => toast.success("Filters applied (demo)")}>
                                                        Apply
                                                    </SlotButton>
                                                </div>
                                            </div>
                                        </Drawer.Content>
                                    </Drawer.Portal>
                                </Drawer.Root>
                            </div>
                        </Resizable.Panel>

                        <Resizable.Separator className="w-1 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 cursor-col-resize" />

                        <Resizable.Panel defaultSize={70} minSize={30} className="p-3">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <div className="font-medium">Search results</div>
                                    <div className="text-sm text-zinc-500 dark:text-zinc-400">
                                        {teachers.isLoading
                                            ? "Loading…"
                                            : teachers.isError
                                                ? "Error"
                                                : `${teachers.data?.length ?? 0} matches`}
                                    </div>
                                </div>

                                <span
                                    className={badgeVariants({
                                        intent: teachers.isError ? "danger" : teachers.isSuccess ? "success" : "neutral",
                                    })}
                                >
                  react-query: {teachers.isLoading ? "loading" : teachers.isError ? "error" : "ok"}
                </span>
                            </div>

                            <Separator.Root className="my-3 h-px bg-zinc-200 dark:bg-zinc-800" />

                            <ScrollArea.Root className="h-[330px] overflow-hidden rounded-md border">
                                <ScrollArea.Viewport className="h-full w-full p-2">
                                    {(teachers.data ?? []).map((t) => (
                                        <ContextMenu.Root key={t.id}>
                                            <ContextMenu.Trigger className="block">
                                                <div className="rounded-md border p-3 bg-white dark:bg-zinc-950 mb-2 hover:bg-zinc-50 dark:hover:bg-zinc-900">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div className="flex items-center gap-3">
                                                            <Avatar.Root className="h-10 w-10 overflow-hidden rounded-full border">
                                                                <Avatar.Fallback className="h-full w-full flex items-center justify-center">
                                                                    {t.fullName
                                                                        .split(" ")
                                                                        .map((p) => p[0])
                                                                        .slice(0, 2)
                                                                        .join("")}
                                                                </Avatar.Fallback>
                                                            </Avatar.Root>

                                                            <div>
                                                                <div className="font-medium">{t.fullName}</div>
                                                                <div className="text-sm text-zinc-500 dark:text-zinc-400">
                                                                    {t.department} · {t.position}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <span className={badgeVariants({ intent: "neutral" })}>{t.rating.total} pts</span>
                                                    </div>
                                                </div>
                                            </ContextMenu.Trigger>

                                            <ContextMenu.Portal>
                                                <ContextMenu.Content className="rounded-md border bg-white p-1 shadow dark:bg-zinc-950">
                                                    <ContextMenu.Item
                                                        className="px-2 py-1 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900"
                                                        onSelect={() => toast(`Open public profile: ${t.id}`)}
                                                    >
                                                        Open public profile
                                                    </ContextMenu.Item>

                                                    <ContextMenu.Item
                                                        className="px-2 py-1 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900"
                                                        onSelect={() => {
                                                            navigator.clipboard?.writeText(t.email).catch(() => {});
                                                            toast.success("Email copied");
                                                        }}
                                                    >
                                                        Copy email
                                                    </ContextMenu.Item>
                                                </ContextMenu.Content>
                                            </ContextMenu.Portal>
                                        </ContextMenu.Root>
                                    ))}

                                    {teachers.isSuccess && (teachers.data?.length ?? 0) === 0 && (
                                        <div className="text-sm text-zinc-500 dark:text-zinc-400 p-2">
                                            No results. Try a different query.
                                        </div>
                                    )}
                                </ScrollArea.Viewport>

                                <ScrollArea.Scrollbar className="flex select-none touch-none p-0.5" orientation="vertical">
                                    <ScrollArea.Thumb className="flex-1 rounded bg-zinc-300 dark:bg-zinc-700" />
                                </ScrollArea.Scrollbar>
                            </ScrollArea.Root>
                        </Resizable.Panel>
                    </Resizable.Group>
                </div>
            </div>
        </section>
    );
}

/* ------------------ Page: Activity Draft ------------------ */
const ActivitySchema = z.object({
    title: z.string().min(5, "At least 5 characters"),
    worksType: z.enum(["SCIENCE", "METHOD", "ORG"]),
    points: z.number().min(1).max(100),
    active: z.boolean(),
    semester: z.enum(["1", "2"]),
    date: z.date().optional(),
    approverOtp: z.string().regex(/^\d{6}$/, "6 digits"),
});
type ActivityValues = z.infer<typeof ActivitySchema>;

function ActivityDraftPage() {
    const [otp, setOtp] = React.useState("");
    const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date());
    const [sliderPoints, setSliderPoints] = React.useState<number[]>([20]);
    const [active, setActive] = React.useState(true);
    const [attachToYear, setAttachToYear] = React.useState(false);

    const form = useForm<ActivityValues>({
        resolver: zodResolver(ActivitySchema),
        defaultValues: {
            title: "Prepare lab report template",
            worksType: "METHOD",
            points: 20,
            active: true,
            semester: "1",
            approverOtp: "",
            date: new Date(),
        },
        mode: "onChange",
    });

    React.useEffect(() => {
        form.setValue("approverOtp", otp, { shouldValidate: true, shouldDirty: true });
    }, [otp, form]);

    React.useEffect(() => {
        form.setValue("date", selectedDate, { shouldValidate: true });
    }, [selectedDate, form]);

    React.useEffect(() => {
        form.setValue("points", sliderPoints[0], { shouldValidate: true, shouldDirty: true });
    }, [sliderPoints, form]);

    React.useEffect(() => {
        form.setValue("active", active, { shouldValidate: true, shouldDirty: true });
    }, [active, form]);

    const onSubmit = (values: ActivityValues) => {
        toast.success("Activity draft saved (demo)");
        toast.message("Payload", { description: JSON.stringify({ ...values, attachToYear }, null, 2) });
    };

    return (
        <section className="space-y-4">
            <h2 className="text-xl font-semibold">Activity draft</h2>

            <div className="rounded-lg border p-4 bg-white dark:bg-zinc-900">
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Title</label>
                        <input className="rounded-md border px-3 py-2 bg-white dark:bg-zinc-950" {...form.register("title")} />
                        {form.formState.errors.title && (
                            <div className="text-xs text-rose-600">{form.formState.errors.title.message}</div>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Works type (Radix Select)</label>

                        <Select.Root
                            value={form.watch("worksType")}
                            onValueChange={(v) =>
                                form.setValue("worksType", v as ActivityValues["worksType"], {
                                    shouldDirty: true,
                                    shouldValidate: true,
                                })
                            }
                        >
                            <Select.Trigger className="inline-flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm bg-white dark:bg-zinc-950">
                                <Select.Value />
                                <Select.Icon>
                                    <ChevronDown className="h-4 w-4" />
                                </Select.Icon>
                            </Select.Trigger>

                            <Select.Portal>
                                <Select.Content className="rounded-md border bg-white p-1 shadow dark:bg-zinc-950">
                                    {(["SCIENCE", "METHOD", "ORG"] as const).map((v) => (
                                        <Select.Item
                                            key={v}
                                            className="px-2 py-1 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900"
                                            value={v}
                                        >
                                            <Select.ItemText>{v}</Select.ItemText>
                                        </Select.Item>
                                    ))}
                                </Select.Content>
                            </Select.Portal>
                        </Select.Root>
                    </div>

                    <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Points (Radix Slider)</label>
                            <span className={badgeVariants({ intent: "neutral" })}>{sliderPoints[0]}</span>
                        </div>

                        <Slider.Root
                            className="relative flex h-5 w-full touch-none select-none items-center"
                            value={sliderPoints}
                            onValueChange={setSliderPoints}
                            max={100}
                            step={1}
                        >
                            <Slider.Track className="relative h-1 w-full grow rounded-full bg-zinc-200 dark:bg-zinc-800">
                                <Slider.Range className="absolute h-full rounded-full bg-zinc-900 dark:bg-zinc-100" />
                            </Slider.Track>
                            <Slider.Thumb className="block h-4 w-4 rounded-full border bg-white dark:bg-zinc-950" />
                        </Slider.Root>

                        {form.formState.errors.points && (
                            <div className="text-xs text-rose-600">{form.formState.errors.points.message}</div>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Semester (Radix RadioGroup)</label>

                        <RadioGroup.Root
                            value={form.watch("semester")}
                            onValueChange={(v) => form.setValue("semester", v as ActivityValues["semester"], { shouldDirty: true, shouldValidate: true })}
                            className="flex items-center gap-6"
                        >
                            <div className="flex items-center gap-2">
                                <RadioGroup.Item className="h-5 w-5 rounded-full border" value="1" id="sem1" />
                                <Label.Root htmlFor="sem1">Semester 1</Label.Root>
                            </div>
                            <div className="flex items-center gap-2">
                                <RadioGroup.Item className="h-5 w-5 rounded-full border" value="2" id="sem2" />
                                <Label.Root htmlFor="sem2">Semester 2</Label.Root>
                            </div>
                        </RadioGroup.Root>
                    </div>

                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Activity date (DayPicker)</label>
                        <div className="rounded-md border p-3 bg-white dark:bg-zinc-950">
                            <DayPicker mode="single" selected={selectedDate} onSelect={setSelectedDate} />
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-6">
                        <div className="flex items-center gap-2">
                            <Checkbox.Root
                                className="h-5 w-5 rounded border bg-white dark:bg-zinc-950"
                                checked={active}
                                onCheckedChange={(v) => setActive(Boolean(v))}
                                id="active"
                            >
                                <Checkbox.Indicator className="flex items-center justify-center">
                                    <Check className="h-4 w-4" />
                                </Checkbox.Indicator>
                            </Checkbox.Root>
                            <Label.Root htmlFor="active">Active (counts in rating)</Label.Root>
                        </div>

                        <div className="flex items-center gap-2">
                            <Switch.Root
                                checked={attachToYear}
                                onCheckedChange={setAttachToYear}
                                className={cn(
                                    "h-6 w-10 rounded-full border px-1",
                                    "data-[state=checked]:bg-zinc-900 dark:data-[state=checked]:bg-zinc-100"
                                )}
                            >
                                <Switch.Thumb
                                    className={cn(
                                        "block h-4 w-4 rounded-full bg-white dark:bg-zinc-950",
                                        "data-[state=checked]:translate-x-4 transition-transform"
                                    )}
                                />
                            </Switch.Root>
                            <span className="text-sm">Attach to current academic year: {attachToYear ? "YES" : "NO"}</span>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Approver OTP (input-otp)</label>

                        <OTPInput
                            value={otp}
                            onChange={setOtp}
                            maxLength={6}
                            pattern={REGEXP_ONLY_DIGITS}
                            containerClassName="group flex items-center"
                            render={({ slots }) => (
                                <div className="flex gap-1">
                                    {slots.map((slot, idx) => (
                                        <OtpSlot key={idx} {...slot} />
                                    ))}
                                </div>
                            )}
                        />

                        {form.formState.errors.approverOtp && (
                            <div className="text-xs text-rose-600">{form.formState.errors.approverOtp.message}</div>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <SlotButton type="submit" disabled={!form.formState.isValid}>
                            <Check className="h-4 w-4" />
                            Save draft
                        </SlotButton>

                        <AlertDialog.Root>
                            <AlertDialog.Trigger asChild>
                                <SlotButton type="button" className="border-rose-300">
                                    <X className="h-4 w-4" />
                                    Delete draft
                                </SlotButton>
                            </AlertDialog.Trigger>

                            <AlertDialog.Portal>
                                <AlertDialog.Overlay className="fixed inset-0 bg-black/40" />
                                <AlertDialog.Content className="fixed left-1/2 top-1/2 w-[min(520px,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-white p-4 dark:bg-zinc-950">
                                    <AlertDialog.Title className="font-semibold">Delete activity draft?</AlertDialog.Title>
                                    <AlertDialog.Description className="text-sm text-zinc-500 dark:text-zinc-400">
                                        Demo confirmation (typical NPP flow: deleting an activity).
                                    </AlertDialog.Description>

                                    <div className="mt-4 flex gap-2">
                                        <AlertDialog.Cancel asChild>
                                            <SlotButton type="button">Cancel</SlotButton>
                                        </AlertDialog.Cancel>

                                        <AlertDialog.Action asChild>
                                            <SlotButton
                                                type="button"
                                                onClick={() => {
                                                    form.reset({
                                                        title: "Prepare lab report template",
                                                        worksType: "METHOD",
                                                        points: 20,
                                                        active: true,
                                                        semester: "1",
                                                        approverOtp: "",
                                                        date: new Date(),
                                                    });
                                                    setOtp("");
                                                    setSelectedDate(new Date());
                                                    setSliderPoints([20]);
                                                    setActive(true);
                                                    setAttachToYear(false);
                                                    toast.success("Draft deleted (demo)");
                                                }}
                                                className="border-rose-300"
                                            >
                                                Confirm delete
                                            </SlotButton>
                                        </AlertDialog.Action>
                                    </div>
                                </AlertDialog.Content>
                            </AlertDialog.Portal>
                        </AlertDialog.Root>

                        <SlotButton
                            type="button"
                            onClick={() => {
                                form.reset({
                                    title: "Prepare lab report template",
                                    worksType: "METHOD",
                                    points: 20,
                                    active: true,
                                    semester: "1",
                                    approverOtp: "",
                                    date: new Date(),
                                });
                                setOtp("");
                                setSelectedDate(new Date());
                                setSliderPoints([20]);
                                setActive(true);
                                setAttachToYear(false);
                                toast("Reset");
                            }}
                        >
                            Reset
                        </SlotButton>
                    </div>
                </form>
            </div>
        </section>
    );
}

function OtpSlot(props: SlotProps) {
    return (
        <div
            className={cn(
                "relative h-12 w-10 rounded-md border",
                "flex items-center justify-center text-lg",
                "bg-white dark:bg-zinc-950",
                props.isActive && "ring-2 ring-zinc-400"
            )}
        >
            <div className={cn("opacity-80", props.char == null && "opacity-30")}>
                {props.char ?? props.placeholderChar}
            </div>
            {props.hasFakeCaret && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-6 w-px bg-zinc-500 animate-pulse" />
                </div>
            )}
        </div>
    );
}

/* ------------------ Page: Analytics ------------------ */
function AnalyticsPage() {
    const [teacherId, setTeacherId] = React.useState("t-101");
    const [types, setTypes] = React.useState<WorksType[]>(["SCIENCE", "METHOD", "ORG"]);
    const [progress, setProgress] = React.useState(55);

    React.useEffect(() => {
        const id = window.setInterval(() => setProgress((p) => (p >= 100 ? 0 : p + 5)), 700);
        return () => window.clearInterval(id);
    }, []);

    const series = useQuery({
        queryKey: ["npp", "stats", teacherId, 2024, 2025, types.join(",")],
        queryFn: () => apiGetTeacherTimeseries({ teacherId, yearFrom: 2024, yearTo: 2025, types }),
    });

    return (
        <section className="space-y-4">
            <h2 className="text-xl font-semibold">Analytics</h2>

            <div className="rounded-lg border p-4 bg-white dark:bg-zinc-900 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Teacher:</span>

                        <Select.Root value={teacherId} onValueChange={setTeacherId}>
                            <Select.Trigger className="inline-flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm bg-white dark:bg-zinc-950 w-64">
                                <Select.Value />
                                <Select.Icon>
                                    <ChevronDown className="h-4 w-4" />
                                </Select.Icon>
                            </Select.Trigger>

                            <Select.Portal>
                                <Select.Content className="rounded-md border bg-white p-1 shadow dark:bg-zinc-950">
                                    {TEACHERS.map((t) => (
                                        <Select.Item
                                            key={t.id}
                                            value={t.id}
                                            className="px-2 py-1 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900"
                                        >
                                            <Select.ItemText>{t.fullName}</Select.ItemText>
                                        </Select.Item>
                                    ))}
                                </Select.Content>
                            </Select.Portal>
                        </Select.Root>
                    </div>

                    <span
                        className={badgeVariants({
                            intent: series.isError ? "danger" : series.isSuccess ? "success" : "neutral",
                        })}
                    >
            chart data: {series.isLoading ? "loading" : series.isError ? "error" : "ok"}
          </span>
                </div>

                <div className="space-y-2">
                    <div className="text-sm font-medium">Works types (ToggleGroup)</div>

                    <ToggleGroup.Root
                        type="multiple"
                        value={types}
                        onValueChange={(v) => setTypes((v as WorksType[]).length ? (v as WorksType[]) : ["METHOD"])}
                        className="inline-flex rounded-md border overflow-hidden"
                    >
                        {(["SCIENCE", "METHOD", "ORG"] as WorksType[]).map((t) => (
                            <ToggleGroup.Item key={t} value={t} className="px-3 py-2 text-sm border-r last:border-r-0">
                                {t}
                            </ToggleGroup.Item>
                        ))}
                    </ToggleGroup.Root>
                </div>

                <div className="space-y-2">
                    <div className="text-sm font-medium">Import progress (Radix Progress)</div>
                    <Progress.Root className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800" value={progress}>
                        <Progress.Indicator
                            className="h-full bg-zinc-900 dark:bg-zinc-100 transition-transform"
                            style={{ transform: `translateX(-${100 - progress}%)` }}
                        />
                    </Progress.Root>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">{progress}%</div>
                </div>

                <div className="h-72 w-full rounded-md border bg-white dark:bg-zinc-950 p-2">
                    <ResponsiveContainer>
                        <LineChart data={series.data ?? []}>
                            <CartesianGrid />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <RechartsTooltip />
                            <Line type="monotone" dataKey="points" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </section>
    );
}

/* ------------------ Page: UI Lab ------------------ */
function UiLabPage() {
    const [checkbox, setCheckbox] = React.useState(false);
    const [radio, setRadio] = React.useState("public");
    const [slider, setSlider] = React.useState<number[]>([35]);
    const [sw, setSw] = React.useState(false);

    const [toastOpen, setToastOpen] = React.useState(false);
    const [toggle, setToggle] = React.useState(false);
    const [toggleGroup, setToggleGroup] = React.useState<string[]>(["method"]);
    const [progress, setProgress] = React.useState(45);

    React.useEffect(() => {
        const id = window.setInterval(() => setProgress((p) => (p >= 100 ? 0 : p + 5)), 700);
        return () => window.clearInterval(id);
    }, []);

    return (
        <section className="space-y-6">
            <h2 className="text-xl font-semibold">UI Lab</h2>

            <div className="rounded-lg border p-4 bg-white dark:bg-zinc-900 space-y-3">
                <div className="font-medium">Navigation / Menubar</div>

                <NavigationMenu.Root className="w-full">
                    <NavigationMenu.List className="flex gap-2">
                        <NavigationMenu.Item>
                            <NavigationMenu.Link className="rounded-md border px-3 py-2 text-sm" href="#">
                                Public statistics
                            </NavigationMenu.Link>
                        </NavigationMenu.Item>
                        <NavigationMenu.Item>
                            <NavigationMenu.Link className="rounded-md border px-3 py-2 text-sm" href="#">
                                My department
                            </NavigationMenu.Link>
                        </NavigationMenu.Item>
                    </NavigationMenu.List>
                </NavigationMenu.Root>

                <Menubar.Root className="flex gap-2">
                    <Menubar.Menu>
                        <Menubar.Trigger className="rounded-md border px-3 py-2 text-sm">Activity</Menubar.Trigger>
                        <Menubar.Portal>
                            <Menubar.Content className="rounded-md border bg-white p-1 shadow dark:bg-zinc-950">
                                <Menubar.Item className="px-2 py-1 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900">
                                    New draft
                                </Menubar.Item>
                                <Menubar.Item className="px-2 py-1 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900">
                                    Export
                                </Menubar.Item>
                            </Menubar.Content>
                        </Menubar.Portal>
                    </Menubar.Menu>
                </Menubar.Root>
            </div>

            <div className="rounded-lg border p-4 bg-white dark:bg-zinc-900">
                <div className="font-medium mb-2">FAQ (Accordion)</div>

                <Accordion.Root type="single" collapsible>
                    <Accordion.Item value="item-1" className="border rounded-md">
                        <Accordion.Header>
                            <Accordion.Trigger className="w-full px-3 py-2 text-left">
                                What is an "activity" in NPP?
                            </Accordion.Trigger>
                        </Accordion.Header>
                        <Accordion.Content className="px-3 pb-3 text-sm text-zinc-500 dark:text-zinc-400">
                            A measurable work item that contributes points to SCIENCE / METHOD / ORG categories.
                        </Accordion.Content>
                    </Accordion.Item>
                </Accordion.Root>
            </div>

            <div className="rounded-lg border p-4 bg-white dark:bg-zinc-900 space-y-3">
                <div className="font-medium">Overlays</div>

                <div className="flex flex-wrap gap-2">
                    <Dialog.Root>
                        <Dialog.Trigger asChild>
                            <SlotButton type="button">Create activity (Dialog)</SlotButton>
                        </Dialog.Trigger>

                        <Dialog.Portal>
                            <Dialog.Overlay className="fixed inset-0 bg-black/40" />
                            <Dialog.Content className="fixed left-1/2 top-1/2 w-[min(520px,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-white p-4 dark:bg-zinc-950">
                                <Dialog.Title className="font-semibold">Create activity</Dialog.Title>
                                <Dialog.Description className="text-sm text-zinc-500 dark:text-zinc-400">
                                    Demo dialog for creating an activity.
                                </Dialog.Description>

                                <div className="mt-4">
                                    <Dialog.Close asChild>
                                        <SlotButton type="button">Close</SlotButton>
                                    </Dialog.Close>
                                </div>
                            </Dialog.Content>
                        </Dialog.Portal>
                    </Dialog.Root>

                    <AlertDialog.Root>
                        <AlertDialog.Trigger asChild>
                            <SlotButton type="button">Approve (AlertDialog)</SlotButton>
                        </AlertDialog.Trigger>

                        <AlertDialog.Portal>
                            <AlertDialog.Overlay className="fixed inset-0 bg-black/40" />
                            <AlertDialog.Content className="fixed left-1/2 top-1/2 w-[min(520px,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-white p-4 dark:bg-zinc-950">
                                <AlertDialog.Title className="font-semibold">Approve activity?</AlertDialog.Title>
                                <AlertDialog.Description className="text-sm text-zinc-500 dark:text-zinc-400">
                                    Typical flow: confirm an irreversible action.
                                </AlertDialog.Description>

                                <div className="mt-4 flex gap-2">
                                    <AlertDialog.Cancel asChild>
                                        <SlotButton type="button">Cancel</SlotButton>
                                    </AlertDialog.Cancel>
                                    <AlertDialog.Action asChild>
                                        <SlotButton type="button" onClick={() => toast.success("Approved (demo)")} className="border-emerald-300">
                                            Confirm
                                        </SlotButton>
                                    </AlertDialog.Action>
                                </div>
                            </AlertDialog.Content>
                        </AlertDialog.Portal>
                    </AlertDialog.Root>

                    <DropdownMenu.Root>
                        <DropdownMenu.Trigger asChild>
                            <SlotButton type="button">Actions (Dropdown)</SlotButton>
                        </DropdownMenu.Trigger>

                        <DropdownMenu.Portal>
                            <DropdownMenu.Content className="rounded-md border bg-white p-1 shadow dark:bg-zinc-950">
                                <DropdownMenu.Item
                                    className="px-2 py-1 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900"
                                    onSelect={() => toast("Action: export")}
                                >
                                    Export CSV
                                </DropdownMenu.Item>
                                <DropdownMenu.Item
                                    className="px-2 py-1 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900"
                                    onSelect={() => toast("Action: print")}
                                >
                                    Print
                                </DropdownMenu.Item>
                            </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                    </DropdownMenu.Root>

                    <Popover.Root>
                        <Popover.Trigger asChild>
                            <SlotButton type="button">Help (Popover)</SlotButton>
                        </Popover.Trigger>

                        <Popover.Portal>
                            <Popover.Content className="rounded-md border bg-white p-3 shadow dark:bg-zinc-950">
                                Use Directory → pick teacher → open stats.
                            </Popover.Content>
                        </Popover.Portal>
                    </Popover.Root>

                    <HoverCard.Root>
                        <HoverCard.Trigger asChild>
                            <SlotButton type="button">Teacher hover (HoverCard)</SlotButton>
                        </HoverCard.Trigger>

                        <HoverCard.Portal>
                            <HoverCard.Content className="rounded-md border bg-white p-3 shadow dark:bg-zinc-950">
                                Quick teacher preview (demo).
                            </HoverCard.Content>
                        </HoverCard.Portal>
                    </HoverCard.Root>

                    <Tooltip.Provider delayDuration={200}>
                        <Tooltip.Root>
                            <Tooltip.Trigger asChild>
                                <SlotButton type="button">Tooltip</SlotButton>
                            </Tooltip.Trigger>

                            <Tooltip.Portal>
                                <Tooltip.Content className="rounded-md border bg-white px-2 py-1 text-xs shadow dark:bg-zinc-950">
                                    This validates Radix Tooltip.
                                </Tooltip.Content>
                            </Tooltip.Portal>
                        </Tooltip.Root>
                    </Tooltip.Provider>
                </div>
            </div>

            <div className="rounded-lg border p-4 bg-white dark:bg-zinc-900 space-y-3">
                <div className="font-medium">Media</div>

                <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-md border p-3">
                        <div className="text-sm font-medium mb-2">Teacher photo (AspectRatio)</div>
                        <AspectRatio.Root ratio={16 / 9} className="overflow-hidden rounded-md border">
                            <div className="h-full w-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                                16:9 preview container
                            </div>
                        </AspectRatio.Root>
                    </div>

                    <div className="rounded-md border p-3">
                        <div className="text-sm font-medium mb-2">Avatar</div>
                        <div className="flex items-center gap-3">
                            <Avatar.Root className="h-10 w-10 overflow-hidden rounded-full border">
                                <Avatar.Fallback className="h-full w-full flex items-center justify-center">NP</Avatar.Fallback>
                            </Avatar.Root>
                            <div className="text-sm text-zinc-500 dark:text-zinc-400">Fallback works</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-lg border p-4 bg-white dark:bg-zinc-900 space-y-3">
                <div className="font-medium">Inputs</div>

                <div className="flex flex-wrap items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Checkbox.Root
                            className="h-5 w-5 rounded border bg-white dark:bg-zinc-950"
                            checked={checkbox}
                            onCheckedChange={(v) => setCheckbox(Boolean(v))}
                            id="cb"
                        >
                            <Checkbox.Indicator className="flex items-center justify-center">
                                <Check className="h-4 w-4" />
                            </Checkbox.Indicator>
                        </Checkbox.Root>
                        <Label.Root htmlFor="cb">Include archived</Label.Root>
                    </div>

                    <RadioGroup.Root value={radio} onValueChange={setRadio} className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <RadioGroup.Item className="h-5 w-5 rounded-full border" value="public" id="ra" />
                            <Label.Root htmlFor="ra">Public</Label.Root>
                        </div>
                        <div className="flex items-center gap-2">
                            <RadioGroup.Item className="h-5 w-5 rounded-full border" value="internal" id="rb" />
                            <Label.Root htmlFor="rb">Internal</Label.Root>
                        </div>
                    </RadioGroup.Root>

                    <div className="flex items-center gap-2">
                        <Switch.Root
                            checked={sw}
                            onCheckedChange={setSw}
                            className={cn(
                                "h-6 w-10 rounded-full border px-1",
                                "data-[state=checked]:bg-zinc-900 dark:data-[state=checked]:bg-zinc-100"
                            )}
                        >
                            <Switch.Thumb
                                className={cn(
                                    "block h-4 w-4 rounded-full bg-white dark:bg-zinc-950",
                                    "data-[state=checked]:translate-x-4 transition-transform"
                                )}
                            />
                        </Switch.Root>
                        <span className="text-sm">Strict validation: {sw ? "ON" : "OFF"}</span>
                    </div>
                </div>
            </div>

            <div className="rounded-lg border p-4 bg-white dark:bg-zinc-900 space-y-3">
                <div className="font-medium">Scroll / Context menu</div>

                <div className="flex flex-wrap gap-6 items-start">
                    <ScrollArea.Root className="h-28 w-64 overflow-hidden rounded-md border">
                        <ScrollArea.Viewport className="h-full w-full p-2 text-sm">
                            {Array.from({ length: 20 }).map((_, i) => (
                                <div key={i} className="py-1">
                                    Dictionary item #{i + 1}
                                </div>
                            ))}
                        </ScrollArea.Viewport>
                        <ScrollArea.Scrollbar className="flex select-none touch-none p-0.5" orientation="vertical">
                            <ScrollArea.Thumb className="flex-1 rounded bg-zinc-300 dark:bg-zinc-700" />
                        </ScrollArea.Scrollbar>
                    </ScrollArea.Root>

                    <ContextMenu.Root>
                        <ContextMenu.Trigger className="rounded-md border px-3 py-2 text-sm">Right click (row actions)</ContextMenu.Trigger>
                        <ContextMenu.Portal>
                            <ContextMenu.Content className="rounded-md border bg-white p-1 shadow dark:bg-zinc-950">
                                <ContextMenu.Item
                                    className="px-2 py-1 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900"
                                    onSelect={() => toast("Context action: copy id")}
                                >
                                    Copy ID
                                </ContextMenu.Item>
                            </ContextMenu.Content>
                        </ContextMenu.Portal>
                    </ContextMenu.Root>
                </div>
            </div>

            <div className="rounded-lg border p-4 bg-white dark:bg-zinc-900 space-y-3">
                <div className="font-medium">Misc</div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-md border p-3 space-y-2">
                        <div className="text-sm font-medium">Rating threshold (Slider)</div>
                        <Slider.Root
                            className="relative flex h-5 w-full touch-none select-none items-center"
                            value={slider}
                            onValueChange={setSlider}
                            max={100}
                            step={1}
                        >
                            <Slider.Track className="relative h-1 w-full grow rounded-full bg-zinc-200 dark:bg-zinc-800">
                                <Slider.Range className="absolute h-full rounded-full bg-zinc-900 dark:bg-zinc-100" />
                            </Slider.Track>
                            <Slider.Thumb className="block h-4 w-4 rounded-full border bg-white dark:bg-zinc-950" />
                        </Slider.Root>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">value: {slider[0]}</div>
                    </div>

                    <div className="rounded-md border p-3 space-y-2">
                        <div className="text-sm font-medium">Background job (Progress)</div>
                        <Progress.Root className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800" value={progress}>
                            <Progress.Indicator
                                className="h-full bg-zinc-900 dark:bg-zinc-100 transition-transform"
                                style={{ transform: `translateX(-${100 - progress}%)` }}
                            />
                        </Progress.Root>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">value: {progress}%</div>
                    </div>
                </div>

                <Separator.Root className="h-px bg-zinc-200 dark:bg-zinc-800" />

                <Tabs.Root defaultValue="tab1">
                    <Tabs.List className="inline-flex gap-2">
                        <Tabs.Trigger className="rounded-md border px-3 py-2 text-sm" value="tab1">
                            Activities
                        </Tabs.Trigger>
                        <Tabs.Trigger className="rounded-md border px-3 py-2 text-sm" value="tab2">
                            Dictionaries
                        </Tabs.Trigger>
                    </Tabs.List>

                    <Tabs.Content value="tab1" className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                        Activities list placeholder
                    </Tabs.Content>
                    <Tabs.Content value="tab2" className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                        Dictionaries list placeholder
                    </Tabs.Content>
                </Tabs.Root>

                <div className="flex flex-wrap gap-4 items-center">
                    <Toggle.Root pressed={toggle} onPressedChange={setToggle} className="rounded-md border px-3 py-2 text-sm">
                        Toggle: {toggle ? "ON" : "OFF"}
                    </Toggle.Root>

                    <ToggleGroup.Root
                        type="multiple"
                        value={toggleGroup}
                        onValueChange={setToggleGroup}
                        className="inline-flex rounded-md border overflow-hidden"
                    >
                        <ToggleGroup.Item className="px-3 py-2 text-sm border-r" value="science">
                            SCIENCE
                        </ToggleGroup.Item>
                        <ToggleGroup.Item className="px-3 py-2 text-sm border-r" value="method">
                            METHOD
                        </ToggleGroup.Item>
                        <ToggleGroup.Item className="px-3 py-2 text-sm" value="org">
                            ORG
                        </ToggleGroup.Item>
                    </ToggleGroup.Root>
                </div>
            </div>

            <div className="rounded-lg border p-4 bg-white dark:bg-zinc-900 space-y-3">
                <div className="font-medium">Radix Toast (package check)</div>

                <Toast.Provider swipeDirection="right">
                    <SlotButton type="button" onClick={() => setToastOpen(true)}>
                        Open Radix Toast
                    </SlotButton>

                    <Toast.Root open={toastOpen} onOpenChange={setToastOpen} className="rounded-md border bg-white p-3 shadow dark:bg-zinc-950">
                        <Toast.Title className="text-sm font-medium">Radix Toast</Toast.Title>
                        <Toast.Description className="text-xs text-zinc-500 dark:text-zinc-400">
                            This validates @radix-ui/react-toast import.
                        </Toast.Description>

                        <div className="mt-2 flex gap-2">
                            <Toast.Action asChild altText="Action">
                                <SlotButton type="button" onClick={() => toast.success("Radix toast action (sonner)")}>
                                    Action
                                </SlotButton>
                            </Toast.Action>
                            <Toast.Close asChild>
                                <SlotButton type="button">Close</SlotButton>
                            </Toast.Close>
                        </div>
                    </Toast.Root>

                    <Toast.Viewport className="fixed bottom-4 right-4 w-96 max-w-[92vw]" />
                </Toast.Provider>
            </div>
        </section>
    );
}

/* ------------------ NotFound ------------------ */
function NotFound() {
    return (
        <section className="space-y-2">
            <div className="text-xl font-semibold">404</div>
            <div className="text-sm text-zinc-500 dark:text-zinc-400">Route not found.</div>
            <Link className="underline" to="/">
                Go home
            </Link>
        </section>
    );
}