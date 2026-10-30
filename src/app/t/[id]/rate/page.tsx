"use client";

import { use, useState, useEffect, useCallback } from "react";
import { Beer as BeerIcon, Brain, Check, EyeOff, Hourglass, PartyPopper, Plus, Settings, Trophy } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BeerPlaceholder } from "@/components/BeerPlaceholder";
import { CurrentBeerTimer } from "@/components/CurrentBeerTimer";
import { LeaderboardWaiting } from "@/components/LeaderboardWaiting";
import { NudgeNotification } from "@/components/NudgeNotification";
import { useNudge } from "@/hooks/useNudge";
import { useActiveTasting } from "@/components/ReturnToTastingButton";
import { SlideToConfirm } from "@/components/SlideToConfirm";
import { StarRating } from "@/components/StarRating";
import { WrapUpOverlay } from "@/components/WrapUpOverlay";
import { FLAVOR_TAGS, type FlavorTag, NOTE_MAX_LENGTH } from "@/lib/flavorTags";

interface Beer {
	id: string;
	name: string;
	brewery: string;
	style?: string;
	abv?: number;
	containerSize?: number;
	containerType?: string;
	priceISK?: number;
	imageUrl?: string;
	country?: string;
	status: string;
	currentSince?: Date | string | null;
	finishedAt?: Date | string | null;
	averageRating?: number;
	ratingCount?: number;
}

interface Tasting {
	id: string;
	title: string;
	status: string;
	currentBeerId?: string | null;
	beers: Beer[];
	currentUserIsLeader?: boolean;
}

// Country to flag emoji mapping (Icelandic country names)
const getCountryFlag = (country: string): string => {
	const flagMap: Record<string, string> = {
		// Icelandic names
		Ísland: "🇮🇸",
		Þýskaland: "🇩🇪",
		Bandaríkin: "🇺🇸",
		Bretland: "🇬🇧",
		Írland: "🇮🇪",
		Belgía: "🇧🇪",
		Holland: "🇳🇱",
		Frakkland: "🇫🇷",
		Spánn: "🇪🇸",
		Ítalía: "🇮🇹",
		Portúgal: "🇵🇹",
		Danmörk: "🇩🇰",
		Noregur: "🇳🇴",
		Svíþjóð: "🇸🇪",
		Finnland: "🇫🇮",
		Pólland: "🇵🇱",
		Tékkland: "🇨🇿",
		Austurríki: "🇦🇹",
		Sviss: "🇨🇭",
		Kanada: "🇨🇦",
		Mexíkó: "🇲🇽",
		Brasilía: "🇧🇷",
		Argentína: "🇦🇷",
		Ástralía: "🇦🇺",
		"Nýja-Sjáland": "🇳🇿",
		Kína: "🇨🇳",
		"Suður-Kórea": "🇰🇷",
		Eistland: "🇪🇪",
		Lettland: "🇱🇻",
		Litháen: "🇱🇹",
		Rússland: "🇷🇺",
		Úkraína: "🇺🇦",
		Grikkland: "🇬🇷",
		Króatía: "🇭🇷",
		Slóvenía: "🇸🇮",
		Rúmenía: "🇷🇴",
		Ungverjaland: "🇭🇺",
		Slóvakía: "🇸🇰",
		Búlgaría: "🇧🇬",
		Serbía: "🇷🇸",
		Færeyjar: "🇫🇴",
		// English names (fallback)
		Iceland: "🇮🇸",
		Germany: "🇩🇪",
		USA: "🇺🇸",
		"United States": "🇺🇸",
		UK: "🇬🇧",
		"United Kingdom": "🇬🇧",
		England: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
		Scotland: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
		Ireland: "🇮🇪",
		Belgium: "🇧🇪",
		Netherlands: "🇳🇱",
		France: "🇫🇷",
		Spain: "🇪🇸",
		Italy: "🇮🇹",
		Portugal: "🇵🇹",
		Denmark: "🇩🇰",
		Norway: "🇳🇴",
		Sweden: "🇸🇪",
		Finland: "🇫🇮",
		Poland: "🇵🇱",
		"Czech Republic": "🇨🇿",
		Austria: "🇦🇹",
		Switzerland: "🇨🇭",
		Canada: "🇨🇦",
		Mexico: "🇲🇽",
		Brazil: "🇧🇷",
		Argentina: "🇦🇷",
		Australia: "🇦🇺",
		"New Zealand": "🇳🇿",
		Japan: "🇯🇵",
		China: "🇨🇳",
		"South Korea": "🇰🇷",
		Estonia: "🇪🇪",
		Latvia: "🇱🇻",
		Lithuania: "🇱🇹",
		Russia: "🇷🇺",
		Ukraine: "🇺🇦",
		Greece: "🇬🇷",
		Croatia: "🇭🇷",
		Slovenia: "🇸🇮",
		Romania: "🇷🇴",
		Hungary: "🇭🇺",
		Slovakia: "🇸🇰",
		Bulgaria: "🇧🇬",
		Serbia: "🇷🇸",
		"Faroe Islands": "🇫🇴",
	};
	return flagMap[country] || "🌍";
};

export default function RatePage({
	params: paramsPromise,
}: {
	params: Promise<{ id: string }>;
}) {
	const params = use(paramsPromise);
	const router = useRouter();
	const [tasting, setTasting] = useState<Tasting | null>(null);
	const [rating, setRating] = useState<number>(0);
	const [tags, setTags] = useState<string[]>([]);
	const [note, setNote] = useState("");
	const [groupGuess, setGroupGuess] = useState<number | null>(null);
	const [loading, setLoading] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [message, setMessage] = useState("");
	const [participantId, setParticipantId] = useState("");
	const [participantInfo, setParticipantInfo] = useState<{
		name?: string;
		code?: string;
	} | null>(null);
	const [checkingAuth, setCheckingAuth] = useState(true);
	const [isEmbedded, setIsEmbedded] = useState(false);
	const [ratingStats, setRatingStats] = useState<{
		totalParticipants: number;
		ratedCount: number;
		pendingCount: number;
		scoresHidden: boolean;
		pending: Array<{ participantId: string; name: string; code: string }>;
	} | null>(null);
	const [hasRated, setHasRated] = useState(false);

	// Wrap-up overlay state
	const [showWrapUp, setShowWrapUp] = useState(false);
	const [wrapUpData, setWrapUpData] = useState<{
		beerName: string;
		brewery: string;
		average: number;
		count: number;
	} | null>(null);
	const [previousBeerId, setPreviousBeerId] = useState<string | null>(null);

	// Leaderboard waiting state (shown after wrap-up completes)
	const [showLeaderboard, setShowLeaderboard] = useState(false);

	// Nudge notification state with timestamp to force re-renders on each nudge
	const [nudgeTimestamp, setNudgeTimestamp] = useState<number | null>(null);

	const { setActiveTasting } = useActiveTasting();

	// Set active tasting once on mount
	useEffect(() => {
		setActiveTasting(params.id);
	}, [params.id, setActiveTasting]);

	// Detect if page is embedded in an iframe
	useEffect(() => {
		setIsEmbedded(window.self !== window.top);
	}, []);

	// Show nudge when a leader nudges and this participant hasn't rated
	const handleIncomingNudge = useCallback(() => {
		setNudgeTimestamp(Date.now());
		if ("vibrate" in navigator) {
			navigator.vibrate([200, 100, 200, 100, 200]);
		}
	}, []);

	useNudge({
		tastingId: params.id,
		participantId,
		enabled: !!participantId,
		onNudge: handleIncomingNudge,
	});

	const loadTasting = useCallback(
		async (showLoadingSpinner = false) => {
			if (showLoadingSpinner) {
				setLoading(true);
			}
			try {
				const response = await fetch(`/api/tastings/${params.id}`);
				if (!response.ok) {
					console.error("Failed to load tasting:", response.statusText);
					setTasting(null);
					return;
				}
				const data = await response.json();
				setTasting(data);
			} catch (error) {
				console.error("Error loading tasting:", error);
				setTasting(null);
			} finally {
				if (showLoadingSpinner) {
					setLoading(false);
				}
			}
		},
		[params.id],
	);

	const loadRatingStats = useCallback(async () => {
		try {
			const response = await fetch(
				`/api/tastings/${params.id}/current/pending-raters`,
			);
			if (!response.ok) {
				return;
			}
			const data = await response.json();
			setRatingStats({
				totalParticipants: data.totalParticipants,
				ratedCount: data.ratedCount,
				pendingCount: data.pendingCount,
				scoresHidden: data.scoresHidden ?? false,
				pending: data.pending || [],
			});
		} catch (error) {
			console.error("Error loading rating stats:", error);
		}
	}, [params.id]);

	// Load initial data and set up polling
	useEffect(() => {
		// Initial load with spinner
		loadTasting(true);

		// Get participant ID from session
		const stored = localStorage.getItem(`participant_${params.id}`);
		if (stored) {
			const data = JSON.parse(stored);
			setParticipantId(data.participantId);
			setCheckingAuth(false);

			// Fetch participant details including name
			fetch(`/api/participants/${data.participantId}`)
				.then((res) => res.json())
				.then((participant) => {
					setParticipantInfo({
						name: participant.user?.name,
						code: participant.code,
					});
				})
				.catch((err) => console.error("Error loading participant info:", err));
		} else {
			// No participant ID found - redirect to join page
			router.push(`/t/${params.id}`);
			return;
		}

		// Poll for updates every 3 seconds (without loading spinner)
		const interval = setInterval(() => {
			loadTasting(false);
			loadRatingStats();
		}, 3000);
		return () => clearInterval(interval);
	}, [params.id, loadTasting, loadRatingStats, router]);

	// Redirect to scores page when tasting is closed
	useEffect(() => {
		if (tasting?.status === "closed") {
			router.push(`/t/${params.id}/scores`);
		}
	}, [tasting?.status, params.id, router]);

	// Derive current beer from tasting state
	const currentBeer = tasting?.beers?.find(
		(b) => b.id === tasting.currentBeerId,
	);

	// Load existing rating and stats when current beer changes
	useEffect(() => {
		if (currentBeer && participantId) {
			loadRatingStats();

			// Load this participant's existing rating for this beer
			fetch(`/api/tastings/${params.id}/ratings?beerId=${currentBeer.id}`)
				.then((res) => (res.ok ? res.json() : null))
				.then(
					(
						existingRating: {
							score: number;
							tags: string[];
							note: string | null;
							groupGuess: number | null;
						} | null,
					) => {
						// Reset for a new beer
						setRating(existingRating?.score ?? 0);
						setTags(existingRating?.tags ?? []);
						setNote(existingRating?.note ?? "");
						setGroupGuess(existingRating?.groupGuess ?? null);
						setHasRated(!!existingRating);
					},
				)
				.catch((err) => console.error("Error loading existing rating:", err));
		}
	}, [currentBeer?.id, participantId, loadRatingStats, params.id]);

	// Detect when a beer has been finished and show wrap-up overlay
	useEffect(() => {
		if (!tasting) return;

		const currentBeerId = tasting.currentBeerId;

		// Only update if the beer ID actually changed
		if (currentBeerId !== previousBeerId) {
			// If current beer changed and we had a previous beer
			if (previousBeerId && previousBeerId !== currentBeerId) {
				// Check if the previous beer is now finished
				const finishedBeer = tasting.beers?.find(
					(b) => b.id === previousBeerId && b.status === "finished",
				);

				if (finishedBeer) {
					// Show wrap-up overlay with the finished beer's data
					setWrapUpData({
						beerName: finishedBeer.name,
						brewery: finishedBeer.brewery,
						average: finishedBeer.averageRating || 0,
						count: finishedBeer.ratingCount || 0,
					});
					setShowWrapUp(true);
					setShowLeaderboard(false); // Hide leaderboard when showing wrap-up
				}
			} else if (currentBeerId) {
				// If a new current beer is set, hide leaderboard
				setShowLeaderboard(false);
			}

			// Update previous beer ID for next comparison
			setPreviousBeerId(currentBeerId || null);
		}
	}, [tasting, previousBeerId]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!currentBeer) {
			setMessage("Enginn bjór valinn");
			setTimeout(() => setMessage(""), 3000);
			return;
		}

		if (!participantId) {
			setMessage("Vinsamlegast taktu þátt í smökkuninni fyrst");
			setTimeout(() => setMessage(""), 5000);
			return;
		}

		setSubmitting(true);
		setMessage("");

		try {
			const response = await fetch(`/api/tastings/${params.id}/ratings`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					beerId: currentBeer.id,
					score: rating,
					tags,
					note,
					// Guesses only count while the group's scores are still hidden
					...(ratingStats?.scoresHidden && { groupGuess }),
				}),
			});

			// Signed out, or this browser's stored participation belongs to another account
			if (response.status === 401 || response.status === 403) {
				router.push(`/t/${params.id}`);
				return;
			}

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || "Failed to submit rating");
			}

			setMessage("Einkunn hefur verið skráð!");
			setHasRated(true);
			setTimeout(() => setMessage(""), 3000);
		} catch (error) {
			setMessage(
				error instanceof Error ? error.message : "Error submitting rating",
			);
			setTimeout(() => setMessage(""), 5000);
		} finally {
			setSubmitting(false);
		}
	};

	// Leader control handlers
	const handleFinishBeer = async () => {
		if (!currentBeer) return;

		try {
			const response = await fetch(
				`/api/tastings/${params.id}/beers/${currentBeer.id}/finish`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
				},
			);

			if (!response.ok) throw new Error("Failed to finish beer");

			setMessage("Bjór kláraður!");
			setTimeout(() => setMessage(""), 3000);
			loadTasting(false);
		} catch (error) {
			setMessage("Villa við að klára bjór");
			setTimeout(() => setMessage(""), 3000);
		}
	};

	const handleNudge = async () => {
		try {
			const response = await fetch(`/api/tastings/${params.id}/nudge`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
			});

			if (!response.ok) throw new Error("Failed to send nudge");

			const data = await response.json();
			setMessage(data.message || "Tilkynning send!");
			setTimeout(() => setMessage(""), 3000);
		} catch (error) {
			setMessage("Villa við að senda tilkynningu");
			setTimeout(() => setMessage(""), 3000);
		}
	};

	if (checkingAuth || loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<img src="/logo.png" alt="Logo" className="w-24 h-24 mx-auto mb-4 animate-pulse" />
					<p className="text-muted-foreground">Hleður...</p>
				</div>
			</div>
		);
	}

	if (!tasting) {
		return (
			<div className="min-h-screen flex items-center justify-center p-4">
				<div className="text-center">
					<h2 className="text-2xl font-bold mb-2">Smökkun fannst ekki</h2>
					<Link href="/" className="text-primary hover:underline">
						Aftur á forsíðu
					</Link>
				</div>
			</div>
		);
	}

	if (tasting.status === "draft") {
		return (
			<div className="min-h-screen flex items-center justify-center p-4">
				<div className="text-center max-w-md">
					<h2 className="text-2xl font-bold mb-2">{tasting.title}</h2>
					<p className="text-muted-foreground mb-4">
						Þessi smökkun er ekki byrjuð enn. Vinsamlegast bíddu eftir að
						skipuleggjandi byrji.
					</p>
					<Hourglass className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
				</div>
			</div>
		);
	}

	// Show redirect message for closed tastings (actual redirect happens in useEffect)
	if (tasting.status === "closed") {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<img src="/logo.png" alt="Logo" className="w-24 h-24 mx-auto mb-4 animate-pulse" />
					<p className="text-muted-foreground">Hleður niðurstöðum...</p>
				</div>
			</div>
		);
	}

	// Show leaderboard if no current beer and we've shown wrap-up before
	if (
		!currentBeer &&
		(showLeaderboard || tasting.beers?.some((b) => b.status === "finished"))
	) {
		return (
			<LeaderboardWaiting
				tastingId={params.id}
				isLeader={tasting.currentUserIsLeader}
			/>
		);
	}

	// Show basic waiting state if no current beer and no finished beers yet
	if (!currentBeer) {
		return (
			<div className="min-h-screen flex items-center justify-center p-4">
				<div className="text-center max-w-md">
					<h2 className="text-2xl font-bold mb-2">{tasting.title}</h2>
					<p className="text-muted-foreground mb-4">
						Bíður eftir næsta bjór...
					</p>
					<BeerIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
					<Link
						href={`/t/${params.id}/scores`}
						className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
					>
						<Trophy className="w-4 h-4" />
						Skoða stigatöflu
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen flex flex-col items-center justify-center p-4">
			<div className="max-w-md w-full space-y-6">
				{/* Leader Controls Access */}
				{!isEmbedded && tasting.currentUserIsLeader && (
					<div className="text-center">
						<Link
							href={`/t/${params.id}/admin`}
							className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm font-medium"
						>
							<svg
								className="w-4 h-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
								/>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
								/>
							</svg>
							Skipta yfir í leiðtogasýn
						</Link>
					</div>
				)}

				{/* Current Beer Card */}
				<div className="bg-card p-6 rounded-lg border space-y-4">
					<div className="text-center">
						{/* Beer Image */}
						<div className="flex justify-center mb-4">
							{currentBeer.imageUrl ? (
								<img
									src={currentBeer.imageUrl}
									alt={currentBeer.name}
									className="h-[148px] w-auto object-contain"
									onError={(e) => {
										// Show placeholder if image fails to load
										const parent = e.currentTarget.parentElement;
										if (parent) {
											e.currentTarget.style.display = "none";
											const placeholder =
												parent.querySelector(".beer-placeholder");
											if (placeholder) {
												(placeholder as HTMLElement).style.display = "block";
											}
										}
									}}
								/>
							) : null}
							<div
								className={
									currentBeer.imageUrl
										? "hidden beer-placeholder"
										: "beer-placeholder"
								}
							>
								<BeerPlaceholder className="h-[148px] w-auto text-muted-foreground" />
							</div>
						</div>
						<h2 className="text-4xl font-bold mb-2">{currentBeer.name}</h2>
						<p className="text-xl text-muted-foreground mb-2">
							{currentBeer.brewery}
						</p>
						{currentBeer.country && (
							<p className="text-lg text-muted-foreground mt-1">
								{getCountryFlag(currentBeer.country)} {currentBeer.country}
							</p>
						)}
						{(currentBeer.style || currentBeer.abv) && (
							<p className="text-base text-muted-foreground mt-1">
								{currentBeer.style}
								{currentBeer.style && currentBeer.abv && ' • '}
								{currentBeer.abv && `${currentBeer.abv}%`}
							</p>
						)}
						<div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
							{currentBeer.containerSize && currentBeer.containerType && (
								<span className="text-base text-muted-foreground">
									{currentBeer.containerSize}ml {currentBeer.containerType}
								</span>
							)}
							{currentBeer.priceISK && (
								<span className="text-base font-semibold text-green-600">
									{currentBeer.priceISK} kr
								</span>
							)}
						</div>
						{currentBeer.currentSince && (
							<div className="flex justify-center mt-2">
								<CurrentBeerTimer
									currentSince={currentBeer.currentSince}
									colorCoded={false}
									size="sm"
								/>
							</div>
						)}
					</div>

					{/* Rating Form */}
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-2">
							<div className="flex justify-center w-full">
								<StarRating
									value={rating}
									onChange={setRating}
									max={10}
									size={28}
									showNumeric={true}
								/>
							</div>
						</div>

						{/* Flavor tags */}
						<div className="flex flex-wrap justify-center gap-2">
							{(Object.entries(FLAVOR_TAGS) as Array<[FlavorTag, string]>).map(
								([tag, label]) => {
									const selected = tags.includes(tag);
									return (
										<button
											key={tag}
											type="button"
											aria-pressed={selected}
											onClick={() =>
												setTags((prev) =>
													selected
														? prev.filter((t) => t !== tag)
														: [...prev, tag],
												)
											}
											className={`px-3 py-1.5 rounded-full border text-sm transition-colors ${
												selected
													? "bg-primary text-primary-foreground border-primary"
													: "bg-background text-muted-foreground hover:bg-muted"
											}`}
										>
											{label}
										</button>
									);
								},
							)}
						</div>

						<div className="space-y-1">
							<textarea
								value={note}
								onChange={(e) => setNote(e.target.value)}
								maxLength={NOTE_MAX_LENGTH}
								rows={2}
								placeholder="Athugasemd (valfrjálst)"
								className="w-full px-3 py-2 rounded-md border bg-background text-sm resize-none"
							/>
							{note.length > NOTE_MAX_LENGTH - 40 && (
								<p className="text-xs text-muted-foreground text-right">
									{note.length} / {NOTE_MAX_LENGTH}
								</p>
							)}
						</div>

						{/* Guess the group average while it's hidden */}
						{ratingStats?.scoresHidden && (
							<div className="rounded-md border border-dashed p-3 space-y-2">
								{groupGuess === null ? (
									<button
										type="button"
										onClick={() => setGroupGuess(rating || 7)}
										className="w-full inline-flex items-center justify-center gap-2 text-sm font-medium text-primary"
									>
										<Brain className="h-4 w-4" />
										Giskaðu á meðaltal hópsins
									</button>
								) : (
									<>
										<div className="flex items-center justify-between text-sm">
											<span className="inline-flex items-center gap-1.5 font-medium">
												<Brain className="h-4 w-4" />
												Meðaltal hópsins verður
											</span>
											<span className="text-lg font-bold text-primary tabular-nums">
												{groupGuess.toFixed(1)}
											</span>
										</div>
										<input
											type="range"
											min={1}
											max={10}
											step={0.1}
											value={groupGuess}
											onChange={(e) => setGroupGuess(Number(e.target.value))}
											aria-label="Gisk á meðaltal hópsins"
											className="w-full accent-primary"
										/>
										<button
											type="button"
											onClick={() => setGroupGuess(null)}
											className="text-xs text-muted-foreground hover:underline"
										>
											Sleppa giski
										</button>
									</>
								)}
							</div>
						)}

						{message && (
							<div
								className={`p-3 rounded-md text-sm text-center ${
									message.includes("Error")
										? "bg-destructive/10 text-destructive"
										: "bg-green-500/10 text-green-600"
								}`}
							>
								{message}
							</div>
						)}

						<button
							type="submit"
							disabled={submitting}
							className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-md font-medium disabled:opacity-50 transition-colors ${
								hasRated
									? "bg-primary text-white hover:bg-primary/90"
									: "bg-primary text-primary-foreground hover:bg-primary/90"
							}`}
						>
							{submitting ? (
								"Skrái..."
							) : hasRated ? (
								<>
									<Check className="w-5 h-5" />
									Uppfæra einkunn
								</>
							) : (
								<>
									<Plus className="w-5 h-5" />
									Skrá einkunn
								</>
							)}
						</button>
					</form>
				</div>

				{/* Rating Progress */}
				{ratingStats && (
					<div className="bg-card p-4 rounded-lg border space-y-3">
						<div className="flex items-center justify-between text-sm">
							<span className="font-medium">Einkunnargjafir</span>
							<span className="text-muted-foreground">
								{ratingStats.ratedCount} / {ratingStats.totalParticipants} hafa gefið
								einkunn
							</span>
						</div>

						{/* Progress Bar */}
						<div className="w-full bg-muted rounded-full h-2">
							<div
								className="bg-primary h-2 rounded-full transition-all duration-500"
								style={{
									width:
										ratingStats.totalParticipants > 0
											? `${(ratingStats.ratedCount / ratingStats.totalParticipants) * 100}%`
											: "0%",
								}}
							/>
						</div>

						{ratingStats.scoresHidden && (
							<p className="text-xs text-muted-foreground text-center">
								<EyeOff className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />
								Einkunnir eru faldar þar til allir hafa gefið einkunn
							</p>
						)}

						{/* Status message */}
						{ratingStats.pendingCount > 0 ? (
							<p className="text-xs text-muted-foreground text-center">
								{ratingStats.pendingCount <= 3 &&
								ratingStats.pending.length > 0 ? (
									<>
										Bíður eftir{" "}
										{ratingStats.pending.map((p, idx) => {
											const isLast = idx === ratingStats.pending.length - 1;
											const isSecondToLast =
												idx === ratingStats.pending.length - 2;
											return (
												<span key={p.participantId}>
													{p.name}
													{!isLast && (isSecondToLast ? " og " : ", ")}
												</span>
											);
										})}
									</>
								) : (
									<>
										Bíður eftir {ratingStats.pendingCount}{" "}
										{ratingStats.pendingCount === 1 ? "aðila" : "aðilum"}
									</>
								)}
							</p>
						) : (
							<p className="text-xs text-green-600 text-center font-medium">
								<PartyPopper className="inline h-4 w-4 mr-1 -mt-0.5" /> Allir hafa gefið einkunn!
							</p>
						)}
					</div>
				)}

				{/* Leader Controls */}
				{!isEmbedded && tasting.currentUserIsLeader && currentBeer && (
					<div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border-2 border-amber-500 space-y-3">
						<div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold">
							<svg
								className="w-5 h-5"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
							Leiðtogastýringar
						</div>
						{ratingStats && ratingStats.pendingCount > 0 && (
							<button
								type="button"
								onClick={handleNudge}
								className="w-full px-4 py-2.5 bg-red-600 text-white rounded-md font-semibold hover:bg-red-700 transition-colors"
							>
								Drífa sig! ({ratingStats.pendingCount})
							</button>
						)}
						<SlideToConfirm
							onConfirm={handleFinishBeer}
							text="Strjúka til að klára bjór"
							confirmText="→"
						/>
					</div>
				)}

				{/* Navigation */}
				<div className="flex justify-center gap-4">
					{!isEmbedded && tasting.currentUserIsLeader && (
						<Link
							href={`/t/${params.id}/admin`}
							className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
						>
							<Settings className="w-4 h-4" />
							Leiðtogasýn
						</Link>
					)}
					<Link
						href={`/t/${params.id}/scores`}
						className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
					>
						<Trophy className="w-4 h-4" />
						Skoða stigatöflu
					</Link>
				</div>
			</div>

			{/* Wrap-up overlay shown when beer is finished */}
			{showWrapUp && wrapUpData && (
				<WrapUpOverlay
					beerName={wrapUpData.beerName}
					brewery={wrapUpData.brewery}
					average={wrapUpData.average}
					count={wrapUpData.count}
					onComplete={() => {
						// After wrap-up completes, hide wrap-up
						setShowWrapUp(false);
						setWrapUpData(null);

						// Force immediate reload to get latest tasting state
						loadTasting(false).then(() => {
							// This will trigger a re-render with fresh tasting data
							// The component will automatically show either the new current beer or leaderboard
						});
					}}
					minDuration={5000}
				/>
			)}

			{/* Nudge notification overlay */}
			{nudgeTimestamp && (
				<NudgeNotification
					key={nudgeTimestamp}
					onComplete={() => {
						console.log("[Rate] Nudge completed, clearing timestamp");
						setNudgeTimestamp(null);
					}}
					duration={3000}
				/>
			)}
		</div>
	);
}
