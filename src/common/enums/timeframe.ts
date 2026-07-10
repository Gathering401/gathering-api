import {DateTime} from "luxon";

export enum Timeframe {
    JustPrevious = 1,
    Last5Campaigns = 2,
    Last6Months = 3,
    LastYear = 4,
    AllTime = 5
}

export const getDateBy = (timeframe: Timeframe) => {
    switch(timeframe) {
        case Timeframe.LastYear:
            return DateTime.now().minus({ year: 1 }).toSQLDate();
        case Timeframe.Last6Months:
            return DateTime.now().minus({ month: 6 }).toSQLDate();
        default:
            return DateTime.now().minus({ year: 1 }).toSQLDate();
    }
}
