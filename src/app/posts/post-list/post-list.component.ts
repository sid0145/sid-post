import { Component, OnDestroy, OnInit } from "@angular/core";
import { PageEvent } from "@angular/material";
import { Subscription } from "rxjs";
import { ToastrService } from "ngx-toastr";

import { AuthService } from "src/app/auth/auth.service";
import { Post } from "../post.model";
import { PostsService } from "../posts.service";

@Component({
  selector: "app-post-list",
  templateUrl: "./post-list.component.html",
  styleUrls: ["./post-list.component.css"],
})
export class PostListComponent implements OnInit, OnDestroy {
  posts: Post[] = [];
  postsSubscription: Subscription;
  isLoading = false;
  currentPage = 1;
  totalPosts = 0;
  postsperPage = 2;
  pageSizeOptions = [1, 2, 5];
  userId: string;

  userIsAuthenticated = false;
  private userAuthSub: Subscription;

  constructor(
    private postService: PostsService,
    private authService: AuthService,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.isLoading = true;
    this.postService.getPosts(this.postsperPage, this.currentPage);
    this.userId = this.authService.getUserId();
    this.postsSubscription = this.postService
      .getPostUpdateListner()
      .subscribe((postData: { posts: Post[]; postCount: number }) => {
        this.isLoading = false;
        this.totalPosts = postData.postCount;
        this.posts = postData.posts;
      });
    this.userIsAuthenticated = this.authService.getIsAuth();
    this.userAuthSub = this.authService
      .getAuthStatusListner()
      .subscribe((isAuthenticated) => {
        this.userIsAuthenticated = isAuthenticated;
        this.userId = this.authService.getUserId();
      });
  }

  onChangedPage(pageData: PageEvent) {
    this.isLoading = true;
    this.currentPage = pageData.pageIndex + 1;
    this.postsperPage = pageData.pageSize;
    this.postService.getPosts(this.postsperPage, this.currentPage);
  }

  onDelete(postId: string) {
    this.isLoading = true;
    this.postService.deletePost(postId).subscribe(() => {
      this.toastr.success("post deleted! ");
      this.postService.getPosts(this.postsperPage, this.currentPage);
    });
  }

  ngOnDestroy() {
    this.postsSubscription.unsubscribe();
    this.userAuthSub.unsubscribe();
  }
}
