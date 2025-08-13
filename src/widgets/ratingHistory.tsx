import { useEffect, useState } from 'react';
import {
	RNPlugin,
	WidgetLocation,
	renderWidget,
	usePlugin,
	useRunAsync,
	usePortal,
} from '@remnote/plugin-sdk';
import './../App.css';



enum Score {
	Forgot = 0,
	RecalledWithEffort = 1,
	PartiallyRecalled = 0.5,
	EasilyRecalled = 1.5,
	Reset = 3,
	TooEarly = 0.01,
	ViewedAsLeech = 2,
}

enum Color {
	Red = 0,
	Green = 1,
	Orange = 0.5,
	Blue = 1.5,
	Purple = 3,
	Yellow = 0.01,
}

function scoreToStringClassMatch(score: number, pretty: boolean = false) {
	const scoreToStringMap: { [key: number]: string } = {
		[Score.Forgot]: 'Forgot',
		[Score.RecalledWithEffort]: 'Good',
		[Score.PartiallyRecalled]: 'Hard',
		[Score.EasilyRecalled]: 'Easy',
		[Score.Reset]: 'Reset',
		[Score.TooEarly]: 'Too Early',
		[Score.ViewedAsLeech]: 'Viewed as Leech',
	};

	if (pretty) {
		return scoreToStringMap[score] || '';
	}

	const stringScore = scoreToStringMap[score] || '';
	return 'square-' + stringScore.toLowerCase().replace(/\s+/g, '-');
}

function scoreToColorClassMatch(score: number) {
	const colorToStringMap: { [key: number]: string } = {
		[Color.Red]: 'red',
		[Color.Green]: 'green',
		[Color.Orange]: 'orange',
		[Color.Blue]: 'blue',
		[Color.Purple]: 'purple',
		[Color.Yellow]: 'yellow',
	};

	const stringColor = colorToStringMap[score] || '';
	return 'highlight-color--' + stringColor;
}

function formatInterval(ms: number): string {
	const MS_IN_DAY = 1000 * 60 * 60 * 24;
	// Using approximations for simplicity in display
	const DAYS_IN_MONTH = 30.44; // Average days in a month
	const DAYS_IN_YEAR = 365.25; // Accounts for leap years

	const totalDays = Math.round(ms / MS_IN_DAY);

	// Rule 3: More than a year
	if (totalDays >= DAYS_IN_YEAR) {
		const years = Math.floor(totalDays / DAYS_IN_YEAR);
		const remainingDays = totalDays % DAYS_IN_YEAR;
		const months = Math.floor(remainingDays / DAYS_IN_MONTH);

		let result = `${years}y`;
		if (months > 0) {
			result += ` ${months}m`;
		}
		return result;
	}

	// Rule 2: More than a month, but up to a year
	if (totalDays > 30) {
		const months = Math.floor(totalDays / DAYS_IN_MONTH);
		const remainingDays = Math.round(totalDays % DAYS_IN_MONTH);

		let result = `${months}m`;
		if (remainingDays > 0) {
			result += ` ${remainingDays}d`;
		}
		return result;
	}

	// Rule 1: Up to a month
	return `${totalDays}d`;
}



function RatingHistoryWidget() {
	const plugin = usePlugin();
	const portal = usePortal(); // The portal hook for rendering on the top layer.
	const [loading, setLoading] = useState(true);
	const [activeTooltip, setActiveTooltip] = useState<number | string | null>(null); // State to track the visible tooltip.

	const card = useRunAsync(async () => {
		const widgetContext = await plugin.widget.getWidgetContext<WidgetLocation.FlashcardUnder>();
		if (!widgetContext?.cardId) return null;
		return await plugin.card.findOne(widgetContext.cardId);
	}, []);

	useEffect(() => {
		if (card) {
			setLoading(false);
		}
	}, [card]);

	if (loading || !card) {
		return <></>;
	}

	// Calculations for the "Current Repetition" Bonus Box
	let currentIntervalMs = 0;
	let currentDelayMs = 0;
	let totalReviews = 0;
	let totalReviewTimeMs = 0;

	if (card.repetitionHistory && card.repetitionHistory.length > 0) {
		totalReviews = card.repetitionHistory.length;
		totalReviewTimeMs = card.repetitionHistory.reduce(
			(sum, history) => sum + history.responseTime,
			0
		);

		if (card.nextRepetitionTime) {
			const lastHistory = card.repetitionHistory[card.repetitionHistory.length - 1];
			currentIntervalMs = card.nextRepetitionTime - lastHistory.date;

			const now = new Date().getTime();
			if (now > card.nextRepetitionTime) {
				currentDelayMs = now - card.nextRepetitionTime;
			}
		}
	}

	return (
		<div id="legend-container">
			<div id="legend">
				<div id="squares">
					{/* Maps all the PAST repetitions */}
					{card.repetitionHistory &&
						card.repetitionHistory.map((history, index, array) => {
							const className = scoreToColorClassMatch(history.score);

							let nextIntervalMs = 0;
							const isLastReview = index === array.length - 1;

							if (isLastReview) {
								if (card.nextRepetitionTime) {
									nextIntervalMs = card.nextRepetitionTime - history.date;
								}
							} else {
								const nextHistory = array[index + 1];
								if (nextHistory && nextHistory.scheduled) {
									nextIntervalMs = nextHistory.scheduled - history.date;
								}
							}

							const reviewDelayMs =
								history.scheduled && history.date > history.scheduled
									? history.date - history.scheduled
									: 0;

							return (
								<div
									className={`tooltip square ${className}`}
									key={history.date}
									onMouseEnter={() => setActiveTooltip(history.date)}
									onMouseLeave={() => setActiveTooltip(null)}
								>
									{/* The tooltip is now rendered conditionally in the portal */}
									{activeTooltip === history.date &&
										portal(
											<span
												className="tooltiptext"
												style={{ visibility: 'visible', opacity: 1 }}
											>
												<div className="widget-container">
													<div className="widget-item">
														<p className="widget-value">
															{scoreToStringClassMatch(
																history.score,
																true
															)}
														</p>
														<h4 className="widget-title">Pressed</h4>
													</div>
													<div className="widget-item">
														<p className="widget-value">
															{Math.round(history.responseTime / 1000)}s
														</p>
														<h4 className="widget-title">
															Response Time
														</h4>
													</div>
													<div className="widget-item">
														<p className="widget-value">
															{new Date(
																history.date
															).toLocaleDateString(undefined, {
																timeZone: 'UTC',
															})}
														</p>
														<h4 className="widget-title">Practice Date</h4>
													</div>
													{nextIntervalMs > 0 && (
														<div className="widget-item">
															<p className="widget-value">
																{formatInterval(nextIntervalMs)}
															</p>
															<h4 className="widget-title">
																Next Interval
															</h4>
														</div>
													)}
													{reviewDelayMs > 1000 * 60 * 60 && (
														<div className="widget-item">
															<p className="widget-value">
																{formatInterval(reviewDelayMs)}
															</p>
															<h4 className="widget-title">
																Review Delay
															</h4>
														</div>
													)}
												</div>
											</span>
										)}
								</div>
							);
						})}

					{/* BONUS: Current Repetition Box */}
					{card.nextRepetitionTime && (
						<div
							className="tooltip square square-current"
							onMouseEnter={() => setActiveTooltip('current')}
							onMouseLeave={() => setActiveTooltip(null)}
						>
							{activeTooltip === 'current' &&
								portal(
									<span
										className="tooltiptext"
										style={{ visibility: 'visible', opacity: 1 }}
									>
										<div className="widget-container">
											<div className="widget-item">
												<p className="widget-value">{totalReviews}</p>
												<h4 className="widget-title">Total Reviews</h4>
											</div>
											<div className="widget-item">
												<p className="widget-value">
													{`${Math.round(
														totalReviewTimeMs / (1000 * 60)
													)} min`}
												</p>
												<h4 className="widget-title">Total Review Time</h4>
											</div>
											{currentIntervalMs > 0 && (
												<div className="widget-item">
													<p className="widget-value">
														{formatInterval(currentIntervalMs)}
													</p>
													<h4 className="widget-title">Current Interval</h4>
												</div>
											)}
											<div className="widget-item">
												<p className="widget-value">
													{new Date(
														card.nextRepetitionTime
													).toLocaleDateString()}
												</p>
												<h4 className="widget-title">Scheduled Date</h4>
											</div>
											{currentDelayMs > 0 && (
												<div className="widget-item">
													<p className="widget-value">
														{formatInterval(currentDelayMs)}
													</p>
													<h4 className="widget-title">Current Delay</h4>
												</div>
											)}
										</div>
									</span>
								)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

renderWidget(RatingHistoryWidget);
