import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  public caluclateTaxByYearSource = new BehaviorSubject<Array<any>>([]);
  public caluclateTaxByYearData$ = this.caluclateTaxByYearSource.asObservable();

  private dataSource = new BehaviorSubject<Array<Object>>([]);
  public currentData$ = this.dataSource.asObservable();

  constructor() {
    this.fetchData()
  }

  fetchData() {
    let temp = new Array();
    let promiseArray = []

    for (let i = 0; i < 13410; i += 500) {
      promiseArray.push(this.fetchCycle(i))
    }
    Promise.all(promiseArray).then(
      list => {
        list.forEach(fetchCallResults => fetchCallResults.forEach((row: any) => temp.push(row)))
        this.dataSource.next(temp);
      }
    )
  }

  fetchCycle(i: number) {
    return fetch(`https://skatteverket.entryscape.net/rowstore/dataset/c67b320b-ffee-4876-b073-dd9236cd2a99/json?_offset=${i}&_limit=500`).then(response => {
      if (!response.ok)
        throw new Error(`https://skatteverket.entryscape.net/rowstore/dataset/c67b320b-ffee-4876-b073-dd9236cd2a99 retuned status ${response.status}`);
      return response.json()
    })
      .then(data => {
        return data.results
      })
      .catch(error => console.log(error));
  }

  getKommunList(): string[] {
    const kommunSet = new Set<string>();
    this.dataSource.value.forEach((row: any) => {
      kommunSet.add(row['kommun']);
    });
    return Array.from(kommunSet);
  }



}




