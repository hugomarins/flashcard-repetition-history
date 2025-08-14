<h1 align="center">
	<img src="https://raw.githubusercontent.com/coldenate/flashcard-repetition-history/main/public/logo.png" alt="Flashcard Repetition History Logo" height="200px">
</h1>

<h3 align="center">
	📚 Flashcard Repetition History: Visualize your learning progress! 📖
</h3>

<p align="center">
	<a href="https://github.com/coldenate/flashcard-repetition-history/stargazers"><img src="https://img.shields.io/github/stars/coldenate/flashcard-repetition-history?colorA=363a4f&colorB=b7bdf8&style=for-the-badge" alt="GitHub Stars"></a>
	<a href="https://github.com/coldenate/flashcard-repetition-history/issues"><img src="https://img.shields.io/github/issues/coldenate/flashcard-repetition-history?colorA=363a4f&colorB=f5a97f&style=for-the-badge" alt="GitHub Issues"></a>
	<a href="https://github.com/coldenate/flashcard-repetition-history/contributors"><img src="https://img.shields.io/github/contributors/coldenate/flashcard-repetition-history?colorA=363a4f&colorB=a6da95&style=for-the-badge" alt="GitHub Contributors"></a>
</p>

<p align="center">
	<img src="https://raw.githubusercontent.com/coldenate/flashcard-repetition-history/main/assets/preview.gif" alt="Flashcard Repetition History in Action">
</p>

## 🚀 Overview

Flashcard Repetition History is a plugin that enhances your flashcard learning experience by visualizing your repetition history. It offers:

-   Immediate Grasp: Get an immediate grasp on your card's performance.
-   Easy Integration: Works instantly with your existing flashcard system.

How it works:

*   Each square represents a repetition.
*   The color that fills the box shows your grading (Forgot/Hard/Good/Easy/Skip).
*   The color of the line that forms the edge of the square represents the overdueness of that card when the repetition took place.
    *   Blue for cards reviewed almost in time (low overdueness)
    *   Yellow for medium overdueness (1.3-1.6x the interval)
    *   Orange for high overdueness (1.6-2x the interval)
    *   Light Red for very high overdueness (2-3x the interval)
    *   Dark Red for critical overdueness (more than 3x the interval)
*   Hovering the mouse over the square shows yet:
    *   Rating (button pressed)
    *   Practice Date
    *   Response Time
    *   Review Delay
    *   Used Interval (= Interval + Delay)
    *   Overdue Ratio (= Used Interval / Interval)
    *   U-Factor (stands for Used Interval Increase, being the ratio of the Next Interval / Used Interval)
    *   Next Interval
*   The last square (at the right) has a distinct appearance and represents the current repetition. As it has not been rated yet, the color is dedicated only to show the overdueness (following the same color code shown above). Hovering over it with the mouse shows:
    *    Total Number of Reviews
    *    Total Review Time
    *    Scheduled Date
    *    Current Interval
    *    Current Delay
    *    Current Used Interval
    *    Current Overdue Ratio


## ⚙️ User Configuration

Flashcard Repetition History allows you to customize your experience through various settings:

1. **Show Past Response**: This setting allows you to see the previous response of a flashcard. When enabled, the corresponding response button will be highlighted when viewing the responses for a flashcard.

2. **Inherit Square Colors from Highlight Colors**: If enabled, the color of the squares will match the highlight colors[^1]. If disabled, the squares will use the default colors or the colors you set individually.

## 📅 Planned Features

-   [x] Improved and Original Design
-   [ ] Show Past Response (kinda like a ghost frame in animation)
-   [ ] **Full** compatibliity with custom themes

Have an idea for a new feature? Feel free to open an issue or submit a pull request!

## 🚧 Work in Progress

Flashcard Repetition History is currently a personal side project and a work in progress. Any feedback/contribution is greatly appreciated, but please understand that it's a hobby project without any strict timelines or commitments. If you have an issue with the plugin, please make a GitHub issue.

## 🚧 Known Issues

When used with Incremental Everything plugin, after pressing "Show Answer", the squares may be hidden and out of sight.

[^1]: This allows for compatibility with themes that use custom highlight colors. The Custom Themes need to properly utilize RemNote's Global CSS Variables for this to work. Reach out to the theme creator if you are unsure. Or if you can read CSS, you can check yourself! :D

---

<p align="center">
	📆 Copyright &copy; 2023 <a href="https://github.com/coldenate" target="_blank">coldenate / Nathan Solis</a>
</p>
