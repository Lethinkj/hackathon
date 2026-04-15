const supabase = require("./supabaseClient");

function subscribeFoodUpdates(onInsert) {
    return supabase
        .channel("food-updates")
        .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "food" },
            (payload) => onInsert(payload)
        )
        .subscribe();
}

module.exports = { subscribeFoodUpdates };
