import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { Subject } from "rxjs";
import { ToastrService } from "ngx-toastr";

import { User } from "./auth.model";
import { environment } from "../../environments/environment";

const BACKEND_URL = environment.apiUrl + "/user/";

@Injectable({
  providedIn: "root",
})
export class AuthService {
  private isAuthenticated = false;
  private token: string;
  private authStatusListner = new Subject<boolean>();
  private tokenTimer: any;
  userId: string;

  constructor(
    private http: HttpClient,
    private router: Router,
    private toastr: ToastrService
  ) {}

  getToken() {
    return this.token;
  }

  getIsAuth() {
    return this.isAuthenticated;
  }

  getAuthStatusListner() {
    return this.authStatusListner.asObservable();
  }

  //getting userid for authorization purpose
  getUserId() {
    return this.userId;
  }

  //signing new user
  signUp(email: string, password: string) {
    const authData: User = { email: email, password: password };
    this.http.post(BACKEND_URL + "signup", authData).subscribe(
      (result) => {
        this.toastr.success("successfully created! please login");
        this.router.navigate(["/login"]);
      },
      (error) => {
        this.authStatusListner.next(false);
        this.toastr.error("oop's user is already exists!");
      }
    );
  }

  //logging an existing user

  login(email: string, password: string) {
    const authData: User = { email: email, password: password };
    this.http
      .post<{ token: string; expiresIn: number; userId: string }>(
        BACKEND_URL + "login",
        authData
      )
      .subscribe(
        (result) => {
          const token = result.token;
          this.token = token;
          if (token) {
            const expiresInDuration = result.expiresIn;
            this.setAuthTimer(expiresInDuration);

            this.isAuthenticated = true;
            this.userId = result.userId;

            const now = new Date();
            const expirationDate = new Date(
              now.getTime() + expiresInDuration * 1000
            );
            this.saveAuthData(token, expirationDate, this.userId);
            this.authStatusListner.next(true);
            this.toastr.success("logged In successfully!");
            this.router.navigate(["/"]);
          }
        },
        (error) => {
          this.authStatusListner.next(false);
          this.toastr.error("please provide a correct username or password!");
        }
      );
  }

  //for logging out

  logout() {
    this.token = null;
    this.isAuthenticated = false;
    this.authStatusListner.next(false);
    this.userId = null;
    clearTimeout(this.tokenTimer);
    this.clearAuthData();
    this.toastr.info("logged out!");
    this.router.navigate(["/"]);
  }

  //automating the logout or setting token on particular time
  autoAuthUser() {
    const autoUserAuth = this.getAuthData();
    if (!autoUserAuth) {
      return;
    }
    const now = new Date();
    const expiresIn = autoUserAuth.expirationDate.getTime() - now.getTime();
    if (expiresIn > 0) {
      this.token = autoUserAuth.token;
      this.isAuthenticated = true;
      this.userId = autoUserAuth.userId;
      this.setAuthTimer(expiresIn / 1000);
      this.authStatusListner.next(true);
    }
  }

  private setAuthTimer(duration: number) {
    this.tokenTimer = setTimeout(() => {
      this.logout();
    }, duration * 1000);
  }

  //saving data to the localStorage
  private saveAuthData(token: string, expirationDate: Date, userId: string) {
    localStorage.setItem("token", token);
    localStorage.setItem("expiration", expirationDate.toISOString());
    localStorage.setItem("userId", userId);
  }

  //removing the local storage data after logout
  private clearAuthData() {
    localStorage.removeItem("token");
    localStorage.removeItem("expiration");
    localStorage.removeItem("userId");
  }

  //getting the auth data
  private getAuthData() {
    const token = localStorage.getItem("token");
    const expirationDate = localStorage.getItem("expiration");
    const userId = localStorage.getItem("userId");
    if (!token || !expirationDate) {
      return;
    }
    return {
      token: token,
      expirationDate: new Date(expirationDate),
      userId: userId,
    };
  }
}
