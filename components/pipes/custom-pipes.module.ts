import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccountamountFormaterPipe, AmountFormaterPipe, FormatAmountPipe, GetBalanceLetter, ParseInt, PositiveNumber } from './numbers-formats.pipe';
import { ParseDatePipe, TimeAgoPipe, ParseMonthPipe, DateTimePipe } from './parse-date.pipe';
import { SafeWebContentPipe, SafeRessourceContentPipe, CheckScriptsPipe } from './safe-web-content.pipe';

@NgModule({
  imports: [CommonModule],
  declarations: [
    FormatAmountPipe,
    TimeAgoPipe,
    ParseDatePipe,
    ParseMonthPipe,
    PositiveNumber,
    SafeWebContentPipe,
    SafeRessourceContentPipe,
    CheckScriptsPipe,
    DateTimePipe,
    AmountFormaterPipe,
    ParseInt,
    AccountamountFormaterPipe,
    GetBalanceLetter
  ],
  exports: [
    FormatAmountPipe,
    TimeAgoPipe,
    ParseDatePipe,
    ParseMonthPipe,
    PositiveNumber,
    SafeWebContentPipe,
    SafeRessourceContentPipe,
    CheckScriptsPipe,
    DateTimePipe,
    AmountFormaterPipe,
    ParseInt,
    AccountamountFormaterPipe,
    GetBalanceLetter
  ]
})
export class CustomPipesModule {}
