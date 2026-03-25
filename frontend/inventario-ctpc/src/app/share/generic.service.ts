import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';


@Injectable({
  providedIn: 'root'
})
export class GenericService {

  // URL del API, definida en enviroments->enviroment.ts
  urlAPI: string = environment.apiURL;
  //Información usuario actual
  currentUser: any;

  constructor(private http: HttpClient) { 

  }

  //GET lista 
  list(endopoint: string, semiAdminData: any = null): Observable<any> {
    return this.http.get<any>(this.urlAPI + endopoint);
    // return this.http.get<any>(this.urlAPI + endopoint, { withCredentials: true });
  }

  //POST crear objeto
   create(endopoint: string, objCreate: any | any, semiAdminData: any = null): Observable<any | any[]> {    
    
    console.log(semiAdminData)
    if (semiAdminData?.adminType && semiAdminData?.currentUserId && semiAdminData.adminType == 'semiadmin') {
      const data = {
        http: 'POST',
        user: semiAdminData.currentUserId,
        url: this.urlAPI + endopoint,
        data: objCreate,
        descripcion: semiAdminData.descripcion
      }

      return this.http.post<any | any[]>(this.urlAPI + 'create-pendiente/', data);
    }
    
    return this.http.post<any | any[]>(this.urlAPI + endopoint, objCreate);
    // return this.http.post<any | any[]>(this.urlAPI + endopoint, objCreate, { withCredentials: true });
  } 

  excel(endpoint: string, objCreate: any): Observable<Blob> {
    return this.http.post<Blob>(this.urlAPI + endpoint, objCreate, { responseType: 'blob' as 'json' });
  }

  excelGet(endopoint: string): Observable<Blob> {
    return this.http.get<Blob>(this.urlAPI + endopoint, { responseType: 'blob' as 'json' });
    // return this.http.get<any>(this.urlAPI + endopoint, { withCredentials: true });
  }

  

  //patch crear objeto
  patch(endopoint: string, objCreate: any | any, semiAdminData: any = null): Observable<any | any[]> {
    
    if (semiAdminData?.adminType && semiAdminData?.currentUserId && semiAdminData.adminType == 'semiadmin') {
      const data = {
        http: 'PATCH',
        user: semiAdminData.currentUserId,
        url: this.urlAPI + endopoint,
        data: objCreate,
        descripcion: semiAdminData.descripcion
      }

      return this.http.post<any | any[]>(this.urlAPI + 'create-pendiente/', data);
    }
    
    return this.http.patch<any | any[]>(this.urlAPI + endopoint, objCreate);
    // return this.http.post<any | any[]>(this.urlAPI + endopoint, objCreate, { withCredentials: true });
  } 

  //patch crear objeto
  delete(endopoint: string, semiAdminData: any = null): Observable<any | any[]> {  
    
    if (semiAdminData?.adminType && semiAdminData?.currentUserId && semiAdminData.adminType == 'semiadmin') {
      const data = {
        http: 'DELETE',
        user: semiAdminData.currentUserId,
        url: this.urlAPI + endopoint,
        data: {},
        descripcion: semiAdminData.descripcion
      }

      return this.http.post<any | any[]>(this.urlAPI + 'create-pendiente/', data);
    }  
    
    return this.http.delete<any | any[]>(this.urlAPI + endopoint);
    // return this.http.post<any | any[]>(this.urlAPI + endopoint, objCreate, { withCredentials: true });
  } 


  postRequest(data: any): Observable<any>  {
    switch(data.http) {
      case 'GET':
        return this.http.get<any>(data.url);

      case 'POST':
        return this.http.post<any | any[]>(data.url, data.data);

      case 'PATCH':
        return this.http.patch<any | any[]>(data.url, data.data);

      case 'DELETE':
        return this.http.delete<any>(data.url);

      default: 
        return this.http.get<any>(data.urlurl);
    }
  }

}
