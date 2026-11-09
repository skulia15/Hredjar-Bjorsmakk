"use client";

import { use, useState, useEffect, useCallback, useRef } from "react";
import { Beer as BeerIcon, Brain, Check, ChevronDown, Hourglass, Lock, PartyPopper, Plus, Trophy, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BeerPlaceholder } from "@/components/BeerPlaceholder";
import { CurrentBeerTimer } from "@/components/CurrentBeerTimer";
import { FoamCard } from "@/components/FoamCard";
import { LeaderboardWaiting } from "@/components/LeaderboardWaiting";
import { NudgeNotification } from "@/components/NudgeNotification";
import { useNudge } from "@/hooks/useNudge";
import { useActiveTasting } from "@/hooks/useActiveTasting";
import { fetchTasting } from "@/lib/fetchTasting";
import { SlideToConfirm } from "@/components/SlideToConfirm";
import { StarRating } from "@/components/StarRating";
import { FlavorTagIcon } from "@/components/FlavorTagIcon";
import { beerImageSrc } from "@/lib/beerImage";
import { usePolling } from "@/hooks/usePolling";
import {
	CUSTOM_TAG_MAX_LENGTH,
	CUSTOM_TAGS_PER_RATING,
	FLAVOR_TAGS,
	type FlavorTag,
	flavorTagLabel,
	isCustomTag,
	normalizeTag,
	NOTE_MAX_LENGTH,
} from "@/lib/flavorTags";

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
	// Only a 404 means the tasting is gone; anything else is an outage we retry through
	const [notFound, setNotFound] = useState(false);
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
		ratingsLocked: boolean;
		beerId: string;
		pending: Array<{ participantId: string; name: string; code: string }>;
	} | null>(null);
	const [hasRated, setHasRated] = useState(false);
	const [tagsOpen, setTagsOpen] = useState(false);
	const [customDraft, setCustomDraft] = useState("");
	const customTagCount = tags.filter(isCustomTag).length;
	// Set on any edit, so the saved rating arriving late doesn't wipe what was just tapped
	const editedRef = useRef(false);

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
				const result = await fetchTasting<Tasting>(params.id);
				if (result.kind === "ok") {
					setNotFound(false);
					setTasting(result.data);
				} else if (result.kind === "not-found") {
					setNotFound(true);
					setTasting(null);
				} else {
					// Keep whatever is on screen; the next poll tries again
					console.error("Tasting unavailable, keeping last state");
				}
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
				ratingsLocked: data.ratingsLocked ?? false,
				beerId: data.currentBeerId,
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
	}, [params.id, loadTasting, loadRatingStats, router]);

	// Poll for updates every 3 seconds (without loading spinner)
	usePolling(() => {
		loadTasting(false);
		loadRatingStats();
	}, 3000);

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
	// Everyone has rated and the scores are out, so this participant's rating can't change any more.
	// The beer check keeps the last beer's lock from carrying over before the next poll
	const ratingLocked =
		hasRated && !!ratingStats?.ratingsLocked && ratingStats.beerId === currentBeer?.id;

	// Flavor tags save on every tap, apart from the rating: tagging never submits a score.
	// Saves go one at a time so a slow request can't land after a newer one
	const tagsRef = useRef<string[]>([]);
	const tagSaves = useRef(Promise.resolve());
	const updateTags = (change: (prev: string[]) => string[]) => {
		if (!currentBeer) return;
		const next = change(tagsRef.current);
		if (next === tagsRef.current) return;
		editedRef.current = true;
		tagsRef.current = next;
		setTags(next);
		const beerId = currentBeer.id;
		tagSaves.current = tagSaves.current.then(async () => {
			try {
				const response = await fetch(`/api/tastings/${params.id}/flavor-tags`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ beerId, tags: next }),
				});
				if (response.status === 401 || response.status === 403) {
					router.push(`/t/${params.id}`);
					return;
				}
				if (!response.ok) throw new Error("Failed to save flavor tags");
			} catch (error) {
				console.error("Error saving flavor tags:", error);
				setMessage("Villa: bragðlýsing vistaðist ekki");
				setTimeout(() => setMessage(""), 5000);
			}
		});
	};

	const addCustomTag = () => {
		if (!customDraft.trim()) return;
		// Same normalizing as the server, so "Kaffi" typed in lights up the Kaffi chip
		const tag = normalizeTag(customDraft);
		updateTags((prev) => {
			if (prev.includes(tag)) return prev;
			if (isCustomTag(tag) && prev.filter(isCustomTag).length >= CUSTOM_TAGS_PER_RATING) return prev;
			return [...prev, tag];
		});
		setCustomDraft("");
	};

	// Load existing rating and stats when current beer changes
	useEffect(() => {
		if (currentBeer && participantId) {
			loadRatingStats();
			editedRef.current = false;
			setTagsOpen(false);
			// A half-typed tag belongs to the last beer
			setCustomDraft("");
			// The last beer's tags must not ride along on a tap before this beer's load
			tagsRef.current = [];

			// Load this participant's existing rating for this beer
			fetch(`/api/tastings/${params.id}/ratings?beerId=${currentBeer.id}`)
				.then((res) => (res.ok ? res.json() : null))
				.then(
					(
						existingRating: {
							// null when they've only tagged it so far
							score: number | null;
							tags: string[];
							note: string | null;
							groupGuess: number | null;
						} | null,
					) => {
						setHasRated(existingRating?.score != null);
						if (editedRef.current) return;
						// Reset for a new beer
						setRating(existingRating?.score ?? 0);
						tagsRef.current = existingRating?.tags ?? [];
						setTags(tagsRef.current);
						setNote(existingRating?.note ?? "");
						setGroupGuess(existingRating?.groupGuess ?? null);
					},
				)
				.catch((err) => console.error("Error loading existing rating:", err));
		}
	}, [currentBeer?.id, participantId, loadRatingStats, params.id]);

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
				// Locked since this screen last polled: show it now rather than in 3 seconds
				if (response.status === 409) loadRatingStats();
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

	if (!tasting && !notFound) {
		// Couldn't reach the server yet; polling keeps retrying
		return (
			<div className="min-h-screen flex items-center justify-center p-4">
				<div className="text-center space-y-2">
					<p className="text-lg font-semibold">Næ ekki sambandi</p>
					<p className="text-muted-foreground">Reyni aftur…</p>
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

	// Between beers: the leaderboard so far. The finished beer's result is revealed on the
	// projector, so phones skip straight here
	if (!currentBeer && tasting.beers?.some((b) => b.status === "finished")) {
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
						className="wiggle inline-flex items-center gap-2 min-h-12 px-5 bg-cranberry text-white rounded-2xl font-extrabold"
					>
						<Trophy className="w-4 h-4" />
						Skoða stigatöflu
					</Link>
				</div>
			</div>
		);
	}

	const chip = "px-2.5 py-1 rounded-full bg-cream-dim text-sm font-semibold";

	return (
		<div className="min-h-screen flex flex-col items-center px-4 pt-4 pb-6">
			<div className="max-w-md w-full flex-1 flex flex-col gap-4">
				{/* Navigation lives in the app header and tasting tabs */}
				{/* Current Beer Card */}
				<FoamCard className="px-5 pt-1.5 pb-5 flex flex-col items-center text-center gap-1">
					<div className="w-[104px] h-[104px] rounded-full bg-gold-soft flex items-center justify-center overflow-hidden">
						{currentBeer.imageUrl ? (
							<img
								src={beerImageSrc(currentBeer.imageUrl)}
								alt={currentBeer.name}
								className="h-[88px] w-auto object-contain"
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
							<BeerPlaceholder className="h-20 w-auto text-[#7A3B12]" />
						</div>
					</div>
					<h2 className="mt-2 text-[length:min(2.125rem,11vw)] leading-none">{currentBeer.name}</h2>
					<p className="text-[1.0625rem] text-muted-foreground">{currentBeer.brewery}</p>
					<div className="flex flex-wrap justify-center gap-1.5 mt-2">
						{currentBeer.country && (
							<span className={chip}>
								{getCountryFlag(currentBeer.country)} {currentBeer.country}
							</span>
						)}
						{currentBeer.style && <span className={chip}>{currentBeer.style}</span>}
						{currentBeer.abv && <span className={chip}>{currentBeer.abv}%</span>}
						{currentBeer.containerSize && currentBeer.containerType && (
							<span className={chip}>
								{currentBeer.containerSize} ml {currentBeer.containerType}
							</span>
						)}
						{currentBeer.priceISK && (
							<span className="px-2.5 py-1 rounded-full bg-holly-soft text-holly text-sm font-extrabold">
								{currentBeer.priceISK} kr
							</span>
						)}
					</div>
					{currentBeer.currentSince && (
						<div className="mt-1.5">
							<CurrentBeerTimer
								currentSince={currentBeer.currentSince}
								colorCoded={false}
								size="sm"
							/>
						</div>
					)}
				</FoamCard>

				{/* Rating Form */}
				<form onSubmit={handleSubmit} className="flex flex-col gap-3">
					<StarRating
						value={rating}
						onChange={(value) => {
							editedRef.current = true;
							setRating(value);
						}}
						max={10}
						size={44}
						perRow={5}
						showNumeric={true}
						disabled={ratingLocked}
					/>

					{/* Flavor tags, folded away by default: eighteen chips made the screen busy */}
					<div className="rounded-2xl bg-pine-light/60">
						<button
							type="button"
							aria-expanded={tagsOpen}
							aria-controls="flavor-tags"
							onClick={() => setTagsOpen((open) => !open)}
							className="w-full min-h-11 flex items-center justify-between gap-3 px-4 py-2 text-left"
						>
							<span className="font-semibold text-cream">
								Bragðlýsingar
								<span className="ml-2 text-sm font-normal text-mint">
									{tags.length > 0 ? `${tags.length} valin` : "valfrjálst"}
								</span>
							</span>
							<ChevronDown
								aria-hidden
								className={`h-5 w-5 shrink-0 text-mint transition-transform ${tagsOpen ? "rotate-180" : ""}`}
							/>
						</button>
						{/* Folded: just the picks, so it's clear what's saved */}
						{!tagsOpen && tags.length > 0 && (
							<div className="flex flex-wrap gap-1.5 px-4 pb-3">
								{tags.map((tag) => (
									<span
										key={tag}
										className="inline-flex items-center gap-1 rounded-full bg-gold px-2.5 py-1 text-xs font-semibold text-ink"
									>
										<FlavorTagIcon tag={tag} className="h-[1.1em] w-[1.1em] shrink-0" />
										{flavorTagLabel(tag)}
									</span>
								))}
							</div>
						)}
						{tagsOpen && (
							<div id="flavor-tags" className="flex flex-wrap justify-center gap-2 px-3 pb-3">
						{(Object.entries(FLAVOR_TAGS) as Array<[FlavorTag, string]>).map(
							([tag, label]) => {
								const selected = tags.includes(tag);
								return (
									<button
										key={tag}
										type="button"
										aria-pressed={selected}
										onClick={() =>
											updateTags((prev) =>
												prev.includes(tag)
													? prev.filter((t) => t !== tag)
													: [...prev, tag],
											)
										}
										className={`inline-flex items-center gap-1.5 min-h-9 px-3.5 rounded-full text-sm font-semibold transition-colors ${
											selected
												? "bg-gold text-ink"
												: "bg-pine-light text-mint hover:bg-pine-line"
										}`}
									>
										<FlavorTagIcon tag={tag} className="h-[1.1em] w-[1.1em] shrink-0" />
										{label}
									</button>
								);
							},
						)}
						{/* Custom "Annað" picks; tapping one removes it */}
						{tags.filter(isCustomTag).map((tag) => (
							<button
								key={tag}
								type="button"
								aria-label={`Fjarlægja ${tag}`}
								onClick={() => updateTags((prev) => prev.filter((t) => t !== tag))}
								className="inline-flex items-center gap-1.5 min-h-9 px-3.5 rounded-full text-sm font-semibold italic bg-gold text-ink"
							>
								<FlavorTagIcon tag={tag} className="h-[1.1em] w-[1.1em] shrink-0" />
								{tag}
								<X aria-hidden className="h-3.5 w-3.5 not-italic" />
							</button>
						))}
						{customTagCount < CUSTOM_TAGS_PER_RATING && (
							<div className="w-full pt-1">
								<input
									value={customDraft}
									onChange={(e) => setCustomDraft(e.target.value)}
									// Leaving the field adds the tag, no button press needed
									onBlur={addCustomTag}
									onKeyDown={(e) => {
										// Enter adds the tag rather than submitting the rating
										if (e.key === "Enter") {
											e.preventDefault();
											addCustomTag();
										}
									}}
									maxLength={CUSTOM_TAG_MAX_LENGTH}
									enterKeyHint="done"
									aria-label="Annað bragð"
									placeholder="Annað… t.d. negull"
									className="w-full min-h-10 px-4 rounded-full bg-pine-deep text-cream placeholder:text-mint/70 text-[0.9375rem] border-0 focus:outline-none focus:ring-2 focus:ring-gold"
								/>
							</div>
						)}
							</div>
						)}
					</div>

					<div className="space-y-1">
						<textarea
							value={note}
							onChange={(e) => {
								editedRef.current = true;
								setNote(e.target.value);
							}}
							maxLength={NOTE_MAX_LENGTH}
							rows={2}
							disabled={ratingLocked}
							placeholder="Athugasemd (valfrjálst)"
							className="w-full px-4 py-3 rounded-2xl bg-pine-light text-cream placeholder:text-mint/70 text-[0.9375rem] resize-none border-0 focus:outline-none focus:ring-2 focus:ring-gold disabled:opacity-60"
						/>
						{note.length > NOTE_MAX_LENGTH - 40 && (
							<p className="text-xs text-mint text-right">
								{note.length} / {NOTE_MAX_LENGTH}
							</p>
						)}
					</div>

					{/* Guess the group average while it's hidden */}
					{ratingStats?.scoresHidden && (
						<div className="rounded-2xl border-2 border-dashed border-pine-line px-4 py-3 space-y-2">
							{groupGuess === null ? (
								<button
									type="button"
									onClick={() => setGroupGuess(rating || 7)}
									className="w-full min-h-11 inline-flex items-center justify-center gap-2 text-[0.9375rem] font-semibold text-gold"
								>
									<Brain className="h-5 w-5" />
									Giskaðu á meðaltal hópsins
								</button>
							) : (
								<>
									<div className="flex flex-wrap items-center justify-between gap-x-3 text-[0.9375rem]">
										<span className="inline-flex items-center gap-1.5 font-semibold">
											<Brain className="h-4 w-4 text-gold" />
											Meðaltal hópsins verður
										</span>
										<span className="text-2xl font-extrabold text-gold tabular-nums">
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
										className="w-full accent-gold"
									/>
									<button
										type="button"
										onClick={() => setGroupGuess(null)}
										className="min-h-9 text-sm text-mint hover:text-cream hover:underline"
									>
										Sleppa giski
									</button>
								</>
							)}
						</div>
					)}

					{/* Pinned to the screen bottom while the form scrolls, so sending is always one tap away */}
					<div className="sticky bottom-0 z-10 -mx-4 px-4 pt-6 pb-[max(1rem,env(safe-area-inset-bottom))] bg-gradient-to-b from-transparent to-background to-30% flex flex-col gap-2">
						{message && (
							<div
								role="status"
								className={`self-center inline-flex items-center gap-2 px-4 py-2 rounded-full text-[0.9375rem] font-extrabold ${
									message.includes("Error") || message.startsWith("Villa")
										? "bg-destructive text-destructive-foreground"
										: "bg-holly-soft text-holly"
								}`}
							>
								{message}
							</div>
						)}

						{ratingLocked ? (
							<div className="w-full min-h-14 inline-flex items-center justify-center gap-2 rounded-2xl bg-pine-light text-mint text-lg font-extrabold">
								<Lock className="w-5 h-5" strokeWidth={2.6} />
								Einkunnir birtar, ekki hægt að breyta
							</div>
						) : (
						<button
							type="submit"
							disabled={submitting || rating === 0}
							className="wiggle w-full min-h-14 inline-flex items-center justify-center gap-2 rounded-2xl bg-gold text-ink text-lg font-extrabold shadow-[0_6px_18px_rgb(0_0_0/0.35)] disabled:opacity-50"
						>
							{submitting ? (
								"Skrái..."
							) : (
								<>
									{hasRated ? (
										<Check className="w-5 h-5" strokeWidth={2.6} />
									) : (
										<Plus className="w-5 h-5" strokeWidth={2.6} />
									)}
									{hasRated ? "Uppfæra einkunn" : "Skrá einkunn"}
									{rating > 0 && (
										<span className="ml-1 rounded-lg bg-ink px-2 py-0.5 text-gold tabular-nums">
											{rating.toFixed(1)}
										</span>
									)}
								</>
							)}
						</button>
						)}
					</div>
				</form>

				{/* Rating Progress */}
				{ratingStats && (
					<div className="rounded-2xl bg-pine-light px-4 py-3 space-y-2">
						<div className="flex flex-wrap items-center justify-between gap-x-3 text-[0.9375rem]">
							<span className="font-semibold">Einkunnargjafir</span>
							<span className="text-mint">
								{ratingStats.ratedCount} / {ratingStats.totalParticipants} hafa gefið einkunn
							</span>
						</div>
						<div className="w-full bg-pine-deep rounded-full h-2.5 overflow-hidden">
							<div
								className="bg-gold h-full rounded-full transition-all duration-500"
								style={{
									width:
										ratingStats.totalParticipants > 0
											? `${(ratingStats.ratedCount / ratingStats.totalParticipants) * 100}%`
											: "0%",
								}}
							/>
						</div>
						{/* Who's still rating shows in the bar and count above; only the finish line gets words */}
						{ratingStats.pendingCount === 0 && (
							<p className="text-sm text-gold font-semibold">
								<PartyPopper className="inline h-4 w-4 mr-1 -mt-0.5" /> Allir hafa gefið einkunn! Skál!
							</p>
						)}
					</div>
				)}

				{/* Leader Controls */}
				{!isEmbedded && tasting.currentUserIsLeader && currentBeer && (
					<div className="rounded-2xl bg-pine-light p-3 space-y-2.5">
						<div className="text-sm font-semibold uppercase tracking-[0.14em] text-gold px-1">
							Leiðtogastýringar
						</div>
						{ratingStats && ratingStats.pendingCount > 0 && (
							<button
								type="button"
								onClick={handleNudge}
								className="wiggle w-full min-h-12 rounded-full bg-cream text-ink font-extrabold"
							>
								Drífa sig! ({ratingStats.pendingCount})
							</button>
						)}
						<SlideToConfirm
							onConfirm={handleFinishBeer}
							text="Strjúka til að klára bjór"
						/>
					</div>
				)}

			</div>


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
