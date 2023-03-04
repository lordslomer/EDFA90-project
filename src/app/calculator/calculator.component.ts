import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, AbstractControl, ValidatorFn} from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { DataService } from '../data.service';
@Component({
  selector: 'app-calculator',
  templateUrl: './calculator.component.html',
  styleUrls: ['./calculator.component.scss']
})

export class CalculatorComponent implements OnInit {
  myForm: FormGroup;
  kommuner: any;
  filteredKommuner: Observable<string[]>;
  years: number[] = [];
  forsamlingar: String[] = [];
  selectedK: boolean = false;
  selectedY: boolean = false;
  resultArray: number[] = [];
  presetArray: String[] = ['',''];

  constructor(private service: DataService) {
    this.myForm = new FormGroup({
      'kommun': new FormControl('',Validators.required),
      'year': new FormControl('',Validators.required),
      'medlem': new FormControl(''),
      'forsamling': new FormControl({value: '', disabled:true}),
      'inkomst': new FormControl('',Validators.required),
    });
    this.filteredKommuner = new Observable<string[]>();
    this.years = Array.from({ length: 10 }, (x, y) => 2023 - y);
  }

  ngOnInit() {
    this.service.currentData$.subscribe((data: any) => {
      this.kommuner = data.reduce((acc: any, row: any) => {
        if (!acc[row['kommun']]) {
          acc[row['kommun']] = new Array();
        }
        acc[row['kommun']].push(row);
        return acc;
      }, []);
      this.filteredKommuner = this.myForm.controls['kommun'].valueChanges.pipe(
        startWith(''),
        map(value => this._filter(value))
      );
    });
    this.service.caluclateTaxByYearData$.subscribe((data: any) => {
      this.presetArray = [...data];
      this.myForm.patchValue({
        'kommun': this.presetArray[0],
        'year': +this.presetArray[1],
      })
      this.onTypeKommun()
      this.onYearSelected()
    })
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return Object.keys(this.kommuner).filter(kommun => kommun.toLowerCase().startsWith(filterValue)).sort();
  }

  onTypeKommun() {
    this.selectedK = Object.keys(this.kommuner).includes(this.myForm.get('kommun')?.value);
    if (!this.selectedK) this.myForm.controls['kommun'].setErrors({ 'incorrect': true });
    this.updateForsamlingar();
  }

  onYearSelected() {
    this.selectedY = this.years.includes(this.myForm.get('year')?.value);
    this.updateForsamlingar();
  }

  onMedlemChange() {
    this.updateForsamlingar()
  }

  private updateForsamlingar() {
    if (this.selectedK && this.selectedY) {
      this.forsamlingar = this.kommuner[this.myForm.get('kommun')?.value].filter((row: any) => row['år'] == this.myForm.get('year')?.value).map((row: any) => row['församling']).sort();
      this.myForm.get('forsamling')?.enable()
    } else {
      this.myForm.get('forsamling')?.disable()
    }
  }

  handleSubmit() {
    if (this.myForm.valid) {
      if (this.myForm.get('medlem')?.value && !this.forsamlingar.includes(this.myForm.get('forsamling')?.value))  {
        this.myForm.controls['forsamling'].setErrors({ 'incorrect': true });
        return;
      }
      this.onCalculate();
    }
  }

  onCalculate() {
    const kommun = this.myForm.get('kommun')?.value;
    const year = this.myForm.get('year')?.value;
    const inkomst = this.myForm.get('inkomst')?.value;
    const forsamling = this.myForm.get('forsamling')?.value;
    let taxRate: number = 0;
    
    if (this.selectedY && this.selectedK && this.myForm.get('medlem')?.value) {
      taxRate = this.kommuner[kommun].filter((row: any) => row['år'] == year).filter((row: any) => row['församling'] == forsamling).map((row: any) => +row['summa, inkl. kyrkoavgift'])[0];
    } else {
      let array = this.kommuner[kommun].filter((row: any) => row['år'] == year);
      taxRate = +array[0]['kommunal-skatt'] + +array[0]['landstings-skatt'] + +array.reduce((acc : number, row : any) => acc + +row['begravnings-avgift'] , 0)/array.length;
    }

    let tax: number = 0;
    let nettoinkomst: number = 0;

    if(inkomst > 598500){
      const overLimit = inkomst - 598500;
      tax = (598500 * (taxRate/100) + overLimit * ((taxRate+20)/100));
      nettoinkomst = inkomst - tax;
    } else if(inkomst < 22208){
      tax = 0;
      nettoinkomst = inkomst - tax;
    } else {
      tax = inkomst * (taxRate/100);
      nettoinkomst = inkomst - tax;
    }
    
    this.resultArray = [+tax.toFixed(2), +nettoinkomst.toFixed(2),+inkomst.toFixed(2),+((tax/inkomst) * 100).toFixed(2)];  
  }

}