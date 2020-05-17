/*
  
*/

import {ParsingResult} from "../../results";
import {MergingRefiner} from "../abstractRefiners";

export default abstract class AbstractMergeDateRangeRefiner extends MergingRefiner {

    abstract patternBetween: () => RegExp

    shouldMergeResults(textBetween: string, currentResult: ParsingResult, nextResult: ParsingResult): boolean {
        return (!currentResult.end && !nextResult.end)
            && textBetween.match(this.patternBetween()) != null;
    }

    mergeResults(textBetween: string, fromResult: ParsingResult, toResult: ParsingResult): ParsingResult {

        if (!fromResult.start.isOnlyWeekdayComponent() && !toResult.start.isOnlyWeekdayComponent() ) {

            toResult.start.knownValues.forEach((value, key) => {
                if (!fromResult.start.isCertain(key)) {
                    fromResult.start.assign(key, value);
                }
            });

            fromResult.start.knownValues.forEach((value, key) => {
                if (!toResult.start.isCertain(key)) {
                    toResult.start.assign(key, value);
                }
            });
        }

        if (fromResult.start.date().getTime() > toResult.start.date().getTime()) {
            
            let fromMoment = fromResult.start.dayjs();
            let toMoment = toResult.start.dayjs();

            if (fromResult.start.isOnlyWeekdayComponent() && fromMoment.add(-7, 'days').isBefore(toMoment)) {
                fromMoment = fromMoment.add(-7, 'days');
                fromResult.start.imply('day', fromMoment.date());
                fromResult.start.imply('month', fromMoment.month() + 1);
                fromResult.start.imply('year', fromMoment.year());
            } else if (toResult.start.isOnlyWeekdayComponent() && toMoment.add(7, 'days').isAfter(fromMoment)) {
                toMoment = toMoment.add(7, 'days');
                toResult.start.imply('day', toMoment.date());
                toResult.start.imply('month', toMoment.month() + 1);
                toResult.start.imply('year', toMoment.year());
            } else {
                [toResult, fromResult] = [fromResult, toResult];
            }
        }

        const result = fromResult.clone();
        result.start = fromResult.start;
        result.end = toResult.start;
        result.index = Math.min(fromResult.index, toResult.index);
        if (fromResult.index < toResult.index) {
            result.text = fromResult.text + textBetween + toResult.text;
        } else {
            result.text = toResult.text + textBetween + fromResult.text;
        }

        return result;
    }
};

