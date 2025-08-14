import { useEffect, useState } from 'react';
import {
	RNPlugin,
	WidgetLocation,
	renderWidget,
	usePlugin,
	useRunAsync,
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
	const DAYS_IN_MONTH = 30.44;
	const DAYS_IN_YEAR = 365.25;

	const totalDays = Math.round(ms / MS_IN_DAY);

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

	if (totalDays > 30) {
		const months = Math.floor(totalDays / DAYS_IN_MONTH);
		const remainingDays = Math.round(totalDays % DAYS_IN_MONTH);
		let result = `${months}m`;
		if (remainingDays > 0) {
			result += ` ${remainingDays}d`;
		}
		return result;
	}

	return `${totalDays}d`;
}

function getOverdueBorderClass(ratio: number): string {
	if (ratio <= 1) return '';
	if (ratio < 1.3) return 'overdue-line-low';
	if (ratio < 1.6) return 'overdue-line-medium';
	if (ratio < 2) return 'overdue-line-high';
	if (ratio < 3) return 'overdue-line-very-high';
	return 'overdue-line-critical';
}

function getOverdueFillClass(ratio: number): string {
	if (ratio <= 1) return 'overdue-fill-low';
	if (ratio < 1.3) return 'overdue-fill-low';
	if (ratio < 1.6) return 'overdue-fill-medium';
	if (ratio < 2) return 'overdue-fill-high';
	if (ratio < 3) return 'overdue-fill-very-high';
	return 'overdue-fill-critical';
}

function RatingHistoryWidget() {
	const plugin = usePlugin();
	const [loading, setLoading] = useState(true);

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

	let currentIntervalMs = 0;
	let currentDelayMs = 0;
	let totalReviews = 0;
	let totalReviewTimeMs = 0;
	let currentUsedIntervalMs = 0;
	let currentOverdueRatio = 1;
	let overdueFillClassName = 'overdue-fill-low';
	let overdueBorderClassName = '';

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

			currentUsedIntervalMs = currentIntervalMs + currentDelayMs;
			currentOverdueRatio = currentIntervalMs > 0 ? currentUsedIntervalMs / currentIntervalMs : 1;
			overdueFillClassName = getOverdueFillClass(currentOverdueRatio);
			overdueBorderClassName = getOverdueBorderClass(currentOverdueRatio);
		}
	}

	return (
		<div id="legend-container">
			<div id="legend">
				<div id="squares">
					{/* This maps all the PAST repetitions */}
					{card.repetitionHistory &&
						card.repetitionHistory.map((history, index, array) => {
							const fillClassName = scoreToColorClassMatch(history.score);
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

							const isFirstReview = index === 0;
							const previousHistory = isFirstReview ? null : array[index - 1];

							const calculatedIntervalMs =
								!isFirstReview && previousHistory
									? history.scheduled - previousHistory.date
									: 0;

							const reviewDelayMs =
								history.scheduled && history.date > history.scheduled
									? history.date - history.scheduled
									: 0;

							const usedIntervalMs =
								!isFirstReview && previousHistory ? history.date - previousHistory.date : 0;

							const overdueRatio =
								calculatedIntervalMs > 0 ? usedIntervalMs / calculatedIntervalMs : 1;
							const borderClassName = getOverdueBorderClass(overdueRatio);

							// NEW: Calculate the U-Factor (Used Interval Increase).
							const uFactor =
								usedIntervalMs > 0 ? nextIntervalMs / usedIntervalMs : 0;

							return (
								<div
									className={`tooltip square ${fillClassName} ${borderClassName}`}
									key={history.date}
								>
									<span className="tooltiptext">
										<div className="widget-container">
											<div className="widget-item">
												<p className="widget-value">
													{scoreToStringClassMatch(history.score, true)}
												</p>
												<h4 className="widget-title">Pressed</h4>
											</div>
											<div className="widget-item">
												<p className="widget-value">
													{new Date(history.date).toLocaleDateString(
														undefined,
														{ timeZone: 'UTC' }
													)}
												</p>
												<h4 className="widget-title">Practice Date</h4>
											</div>
											<div className="widget-item">
												<p className="widget-value">
													{Math.round(history.responseTime / 1000)}s
												</p>
												<h4 className="widget-title">Response Time</h4>
											</div>
											{!isFirstReview && (
												<>
													<div className="widget-item">
														<p className="widget-value">
															{formatInterval(reviewDelayMs)}
														</p>
														<h4 className="widget-title">Review Delay</h4>
													</div>
													<div className="widget-item">
														<p className="widget-value">
															{formatInterval(usedIntervalMs)}
														</p>
														<h4 className="widget-title">Used Interval</h4>
													</div>
													<div className="widget-item">
														<p className="widget-value">
															{`${Math.round(overdueRatio * 100)}%`}
														</p>
														<h4 className="widget-title">Overdue Ratio</h4>
													</div>
													{/* NEW: Display the U-Factor in the tooltip for past reviews. */}
													{uFactor > 0 && (
														<div className="widget-item">
															<p className="widget-value">
																{`${uFactor.toFixed(2)}x`}
															</p>
															<h4 className="widget-title">
																U-Factor
															</h4>
														</div>
													)}
												</>
											)}
											{nextIntervalMs > 0 && (
												<div className="widget-item">
													<p className="widget-value">
														{formatInterval(nextIntervalMs)}
													</p>
													<h4 className="widget-title">Next Interval</h4>
												</div>
											)}
										</div>
									</span>
								</div>
							);
						})}

					{/* --- BONUS: Current Repetition Box --- */}
					{card.nextRepetitionTime && (
						<div
							className={`tooltip square ${overdueFillClassName} ${overdueBorderClassName} square-current-distinct`}
						>
							<span className="tooltiptext">
								<div className="widget-container">
									<div className="widget-item">
										<p className="widget-value">{totalReviews}</p>
										<h4 className="widget-title">Total Reviews</h4>
									</div>
									<div className="widget-item">
										<p className="widget-value">
											{`${Math.round(totalReviewTimeMs / (1000 * 60))} min`}
										</p>
										<h4 className="widget-title">Total Review Time</h4>
									</div>
									<div className="widget-item">
										<p className="widget-value">
											{new Date(
												card.nextRepetitionTime
											).toLocaleDateString()}
										</p>
										<h4 className="widget-title">Scheduled Date</h4>
									</div>
									{currentIntervalMs > 0 && (
										<div className="widget-item">
											<p className="widget-value">
												{formatInterval(currentIntervalMs)}
											</p>
											<h4 className="widget-title">Current Interval</h4>
										</div>
									)}
									{currentDelayMs > 0 && (
										<div className="widget-item">
											<p className="widget-value">
												{formatInterval(currentDelayMs)}
											</p>
											<h4 className="widget-title">Current Delay</h4>
										</div>
									)}
									<div className="widget-item">
										<p className="widget-value">
											{formatInterval(currentUsedIntervalMs)}
										</p>
										<h4 className="widget-title">Used Interval</h4>
									</div>
									<div className="widget-item">
										<p className="widget-value">
											{`${Math.round(currentOverdueRatio * 100)}%`}
										</p>
										<h4 className="widget-title">Overdue Ratio</h4>
									</div>
								</div>
							</span>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

renderWidget(RatingHistoryWidget);
