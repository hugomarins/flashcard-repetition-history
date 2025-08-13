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
		[Score.RecalledWithEffort]: 'Recalled with Effort',
		[Score.PartiallyRecalled]: 'Partially Recalled',
		[Score.EasilyRecalled]: 'Easily Recalled',
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

	// Handle pluralization easily
	const plural = (count: number, singular: string) => (count === 1 ? singular : `${singular}s`);

	// Rule 3: More than a year
	if (totalDays >= DAYS_IN_YEAR) {
		const years = Math.floor(totalDays / DAYS_IN_YEAR);
		const remainingDays = totalDays % DAYS_IN_YEAR;
		const months = Math.floor(remainingDays / DAYS_IN_MONTH);

		let result = `${years} ${plural(years, 'year')}`;
		if (months > 0) {
			result += `, ${months} ${plural(months, 'month')}`;
		}
		return result;
	}

	// Rule 2: More than a month, but up to a year
	if (totalDays > 30) {
		const months = Math.floor(totalDays / DAYS_IN_MONTH);
		const remainingDays = Math.round(totalDays % DAYS_IN_MONTH);

		let result = `${months} ${plural(months, 'month')}`;
		if (remainingDays > 0) {
			result += `, ${remainingDays} ${plural(remainingDays, 'day')}`;
		}
		return result;
	}

	// Rule 1: Up to a month
	return `${totalDays} ${plural(totalDays, 'day')}`;
}

function RatingHistoryWidget() {
	const plugin = usePlugin();

	const [loading, setLoading] = useState(true);
	// NOTE: The 'inherit-from-highlight-colors' logic is commented out in the original code,
	// so I'm omitting it here for clarity. You can add it back if you use it.

	const repetitionHistory = useRunAsync(async () => {
		const widgetContext = await plugin.widget.getWidgetContext<WidgetLocation.FlashcardUnder>();
		if (!widgetContext?.cardId) return;
		const card = await plugin.card.findOne(widgetContext.cardId);
		return card?.repetitionHistory;
	}, []);

	useEffect(() => {
		if (repetitionHistory) {
			setLoading(false);
		}
	}, [repetitionHistory]);

	if (loading || !repetitionHistory) {
		return <></>;
	}

	return (
		<div id="legend-container">
			<div id="legend">
				<div id="squares">
					{/* For each repetition history, build a square accordingly */}
					{repetitionHistory.map((history, index, array) => {
						const className = scoreToColorClassMatch(history.score);

						// The next item in the history array.
						const nextHistory = array[index + 1];

						// Calculate review delay (only if it was scheduled).
						const reviewDelayMs =
							history.scheduled && history.date > history.scheduled
								? history.date - history.scheduled
								: 0;

						return (
							<div className={`tooltip square ${className}`} key={history.date}>
								<span className="tooltiptext">
									<div className="widget-container">
										{/* Pressed Button */}
										<div className="widget-item">
											<p className="widget-value">
												{scoreToStringClassMatch(history.score, true)}
											</p>
											<h4 className="widget-title">Pressed</h4>
										</div>
										{/* Response Time */}
										<div className="widget-item">
											<p className="widget-value">
												{Math.round(history.responseTime / 1000)} seconds
											</p>
											<h4 className="widget-title">Response Time</h4>
										</div>
										{/* Practice Date */}
										<div className="widget-item">
											<p className="widget-value">
												{new Date(history.date).toLocaleDateString(
													undefined,
													{ timeZone: 'UTC' }
												)}
											</p>
											<h4 className="widget-title">Practice Date</h4>
										</div>
										{/* --- CORRECTED "NEXT INTERVAL" LOGIC --- */}
										{nextHistory && nextHistory.scheduled && (
											<div className="widget-item">
												<p className="widget-value">
													{formatInterval(
														nextHistory.scheduled - history.date
													)}
												</p>
												<h4 className="widget-title">Next Interval</h4>
											</div>
										)}
										{/* --- BONUS "REVIEW DELAY" LOGIC --- */}
										{reviewDelayMs > 1000 * 60 * 60 && ( // Only show if delay > 1 hour
											<div className="widget-item">
												<p className="widget-value">
													{formatInterval(reviewDelayMs)}
												</p>
												<h4 className="widget-title">Review Delay</h4>
											</div>
										)}
									</div>
								</span>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}

renderWidget(RatingHistoryWidget);
