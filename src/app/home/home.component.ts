import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { DataService } from '../data.service';
import { MatPaginator} from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit{
  displayedColumns: string[] = ['kommun', 'skatt', 'buttons'];
  dataSource: MatTableDataSource<any> = new MatTableDataSource();
  filterValueKommun: string = '';
  filterValueSkatt: string = '';

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(private service: DataService, private router: Router) { }

  ngOnInit() {
    this.service.currentData$.subscribe(data => {
      const reducedData = data.filter((row: any) => row['år'] == 2023)
        .reduce((acc: any, row: any) => {
          if (!acc[row['kommun']]) {
            acc[row['kommun']] = {
              kommun: row['kommun'], skatt: +row['summa, exkl. kyrkoavgift']
            };
          }
          return acc;
        }, {})
      this.dataSource = new MatTableDataSource(Object.values(reducedData));
      this.dataSource.sort = this.sort;
      this.dataSource.paginator = this.paginator;
    });
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  applyFilter(event : Event) {
    switch ((event.target as HTMLInputElement).name) {
      case 'kommun':
        this.filterValueSkatt = '';
        this.dataSource.filter = this.filterValueKommun.trim().toLowerCase();
        this.dataSource.filterPredicate = (data: any, filter: string) => data.kommun.toLowerCase().startsWith(filter);
        break;
      case 'skatt':
        this.filterValueKommun = '';
        this.dataSource.filter = this.filterValueSkatt.trim().toLowerCase();
        this.dataSource.filterPredicate = (data: any, filter: string) => data.skatt.toLowerCase().startsWith(filter);
        break;
      default: break;
    }
  }

  goToMunicipality(name : string) {
    this.router.navigate(['/municipality', name])
  }

  sortData(sort: MatSort) {
    const data = this.dataSource.filteredData.slice();
    if (!sort.active || sort.direction === '') {
      this.dataSource.data = data;
      return;
    }

    this.dataSource.data = data.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'kommun': return compare(a.kommun, b.kommun, isAsc);
        case 'skatt': return compare(a.skatt, b.skatt, isAsc);
        default: return 0;
      }
    });
  }
}

function compare(a: string, b: string, isAsc: boolean) {
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}
