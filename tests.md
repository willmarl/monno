| Feature                | Unit Tests | API Tests | E2E Tests |
| ---------------------- | :--------: | :-------: | :-------: |
| **Auth**               |
| Register               |     -      |    ✅     |    ✅     |
| Login                  |     ✅     |    ✅     |    ✅     |
| Logout                 |     -      |    ✅     |    ✅     |
| Logout All Sessions    |     -      |    ✅     |     -     |
| Refresh Token          |     ✅     |    ✅     |     -     |
| Password Reset         |     ✅     |     -     |     -     |
| Get Sessions           |     -      |    ✅     |     -     |
| Email Verification     |     -      |     -     |     -     |
| OAuth (Google/GitHub)  |     -      |     -     |     -     |
| **Posts**              |
| Create Post            |     ✅     |    ✅     |    ✅     |
| Read Post              |     ✅     |    ✅     |    ✅     |
| Update Post            |     ✅     |    ✅     |    ✅     |
| Delete Post (Soft)     |     ✅     |    ✅     |    ✅     |
| Like Post              |     -      |    ✅     |    ✅     |
| View Post              |     -      |    ✅     |     -     |
| Search Posts           |     -      |    ✅     |     -     |
| **Users**              |
| Create Account         |     -      |    ✅     |    ✅     |
| View Profile (Me)      |     -      |    ✅     |    ✅     |
| View Public Profile    |     -      |     -     |    ✅     |
| Update Profile         |     ✅     |    ✅     |    ✅     |
| Change Password        |     ✅     |    ✅     |    ✅     |
| Delete Account (Soft)  |     ✅     |     -     |     -     |
| Search Users           |     -      |    ✅     |     -     |
| Avatar Upload          |     -      |     -     |     -     |
| **Collections**        |
| Create Collection      |     -      |    ✅     |    ✅     |
| Add Post to Collection |     -      |    ✅     |    ✅     |
| View Collection        |     -      |    ✅     |    ✅     |
| Update Collection      |     -      |    ✅     |     -     |
| Delete Collection      |     -      |    ✅     |     -     |
| **Comments**           |
| Create Comment         |     -      |    ✅     |     -     |
| Edit Comment           |     -      |    ✅     |     -     |
| Delete Comment (Soft)  |     -      |    ✅     |     -     |
| Like Comment           |     -      |    ✅     |     -     |
| **Error Handling**     |
| 400 Bad Request        |     -      |    ✅     |     -     |
| 401 Unauthorized       |     -      |    ✅     |    ✅     |
| 403 Forbidden          |     -      |    ✅     |     -     |
| 404 Not Found          |     -      |    ✅     |    ✅     |

## Still Need Testing

- Admin dashboard (users, posts, comments, logs, support, stats)
- Delete account
- Email verification
- Changing password
- Session management (logging out other sessions)
- Support ticket feature
