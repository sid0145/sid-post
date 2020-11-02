import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { Subject } from "rxjs";
import { map } from "rxjs/operators";
import { ToastrService } from "ngx-toastr";

import { Post } from "./post.model";
import { environment } from "../../environments/environment";

const BACKEND_URL = environment.apiUrl + "/posts";

@Injectable({
  providedIn: "root",
})
export class PostsService {
  private posts: Post[] = [];
  private postUpdated = new Subject<{ posts: Post[]; postCount: number }>();

  constructor(
    private http: HttpClient,
    private router: Router,
    private toastr: ToastrService
  ) {}

  //this return empty because nothing is there in initally
  getPosts(postsPerPage: number, currentPage: number) {
    const queryParams = `?pagesize=${postsPerPage}&page=${currentPage}`;

    this.http
      .get<{ message: string; posts: any; maxPosts: number }>(
        BACKEND_URL + queryParams
      )
      .pipe(
        map((postData) => {
          return {
            posts: postData.posts.map((post) => {
              return {
                id: post._id,
                title: post.title,
                content: post.content,
                imagePath: post.imagePath,
                creator: post.creator,
              };
            }),
            maxPosts: postData.maxPosts,
          };
        })
      )
      .subscribe(
        (transformedData) => {
          this.posts = transformedData.posts;
          this.postUpdated.next({
            posts: [...this.posts],
            postCount: transformedData.maxPosts,
          });
        },
        (err) => {
          this.toastr.error("please check your connection!");
        }
      );
  }

  //to update the posts whenever a event occurs
  getPostUpdateListner() {
    return this.postUpdated.asObservable();
  }

  //getting a single post for editing
  getPost(id: string) {
    return this.http.get<{
      _id: string;
      title: string;
      content: string;
      imagePath: string;
      creator: string;
    }>(BACKEND_URL + "/" + id);
  }

  //adding post
  addPost(title: string, content: string, image: File) {
    const postData = new FormData();
    postData.append("title", title);
    postData.append("content", content);
    postData.append("image", image, title);
    console.log(postData);

    this.http
      .post<{ message: string; post: Post }>(BACKEND_URL, postData)
      .subscribe(
        (resData) => {
          this.toastr.success("post created successfully!");
          this.router.navigate(["/"]);
        },
        (err) => {
          console.log(err.message);
        }
      );
  }
  //updating posts

  updatePost(id: string, title: string, content: string, image: File | string) {
    let postData;
    if (typeof image === "object") {
      postData = new FormData();
      postData.append("id", id);
      postData.append("title", title);
      postData.append("content", content);
      postData.append("image", image, title);
    } else {
      postData = {
        id: id,
        title: title,
        content: content,
        imagePath: image,
        creator: null,
      };
      console.log(postData);
    }

    this.http.put(BACKEND_URL + "/" + id, postData).subscribe(
      (res) => {
        this.toastr.success("post updated successfully!");
        this.router.navigate(["/"]);
      },
      (err) => {
        this.router.navigate(["/"]);
        this.toastr.error("something went wrong!");
      }
    );
  }

  //daleting post
  deletePost(postId: string) {
    return this.http.delete(BACKEND_URL + "/" + postId);
  }
}
