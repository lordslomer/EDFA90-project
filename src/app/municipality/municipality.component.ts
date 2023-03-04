import { Component} from '@angular/core';
import { DataService } from '../data.service';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';



@Component({
  selector: 'app-municipality',
  templateUrl: './municipality.component.html',
  styleUrls: ['./municipality.component.scss']
})
export class MunicipalityComponent {
  name = '';
  data = {}; 
  panelStates: boolean[] = [];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private service: DataService
  ) { }
  
  ngOnInit() {
    this.route.paramMap.subscribe((params: ParamMap) => {
      this.name = params.get('name') || ''
    });
    this.service.currentData$.subscribe(data => { 
      this.data = data
        .filter((row: any) => row['kommun'] == this.name)
        .reduce((acc: any, row: any) => {
          if (!acc[row['år']]) {
            acc[row['år']] = {'k-skatt' : row['kommunal-skatt'],'l-skatt' : row['landstings-skatt'], info: new Array()}
          }
          acc[row['år']].info.push({
            'b-avgift' : row['begravnings-avgift'],
            'församling' : row['församling'],
            'kyrkoavgift': row['kyrkoavgift'],
            'exkl-skatt' : row['summa, exkl. kyrkoavgift'],
            'inkl-skatt' : row['summa, inkl. kyrkoavgift']
          })
          return acc;
        }, {})
    })
  }

  calculateTax(index: number) {
    let dataArray = Object.keys(this.data);
    let info = new Array<any>();
    info.push(this.name);
    info.push(dataArray[dataArray.length - index - 1])
    this.service.caluclateTaxByYearSource.next(info);
    this.router.navigate(['/calculator'])
  }

  sortYears = (a:any, b:any) => {
    return b.key-a.key;
  }

} 
