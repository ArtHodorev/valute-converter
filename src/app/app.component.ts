import { Component, OnDestroy, OnInit } from '@angular/core';
import { RestService } from './services/rest.service';
import { NgxXml2jsonService } from 'ngx-xml2json';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {

  rubControlValue = 0;
  eurControlValue = '0.0000';
  eurValue = null;

  arrOfApi = [
    'https://www.cbr-xml-daily.ru/daily_utf8.xml',
    'https://www.cbr-xml-daily.ru/daily_json.js'
  ];

  parser = new DOMParser();
  index = 0;

  source = interval(10000);

  subscription: Subscription;


  constructor(private restService: RestService, private ngxXml2jsonService: NgxXml2jsonService) {
  }

  ngOnInit(): void {
    this.catchData();
    this.subscription = this.source.subscribe(val => this.catchData());
  }

  catchData(): void {
    console.log('Start CatchData');
    this.restService.getValutes(this.arrOfApi[this.index]).subscribe(
      data => {
        if (this.index === 0) {
          const xml = this.parser.parseFromString(data, 'text/xml');
          const obj = this.ngxXml2jsonService.xmlToJson(xml);
          this.valuteFromXML(obj);
        } else {
          this.valuteFromJS(data);
        }
      },
      err => {
        this.index += 1;
        if (this.index <= this.arrOfApi.length) {
          this.catchData();
        } else {
          console.log('Хьюстон, у нас закончились источники данных');
        }
      }
    );
  }

  valuteFromXML(data): void {
    data.ValCurs.Valute.forEach((v, i) => {
      if (v.CharCode === 'EUR') {
        const parts = v.Value.toString().split(',');
        this.eurValue = +parts.join('.');
      }
    });
  }

  valuteFromJS(data): void {
    this.eurValue = data.Valute.EUR.Value;
  }

  convertToEUR(): void {
    this.eurControlValue = (this.rubControlValue / this.eurValue).toFixed(4);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

}
