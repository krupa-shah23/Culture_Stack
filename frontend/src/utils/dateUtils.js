export const isNewDay = (currentDateString, previousDateString) => {
    if (!previousDateString) return true; // First message is always a new day

    const current = new Date(currentDateString);
    const previous = new Date(previousDateString);

    return (
        current.getFullYear() !== previous.getFullYear() ||
        current.getMonth() !== previous.getMonth() ||
        current.getDate() !== previous.getDate()
    );
};

export const formatDateLabel = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();

    const isToday =
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    const isYesterday =
        date.getDate() === yesterday.getDate() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getFullYear() === yesterday.getFullYear();

    if (isToday) {
        return "Today";
    } else if (isYesterday) {
        return "Yesterday";
    } else {
        return date.toLocaleDateString([], {
            weekday: "short",
            month: "short",
            day: "numeric",
            year:
                date.getFullYear() === now.getFullYear()
                    ? undefined
                    : "numeric",
        });
    }
};
