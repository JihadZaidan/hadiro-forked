# structure comnponent project backend

```bash
server/
    |--- docs/ 
        |--- assets/
            |--- logo.png 
        |--- stylesheets/ 
            |--- extra.css 
        |--- index.id.md
        |--- index.md 
    |--- prisma/
        |--- migrations/
            |--- 20241206035001_init/
                |--- migration.sql
            |--- 20241208031224_add_violations_table/
                |--- migration.sql
            |--- 20241213123711_merged_inattendances_into_attendances
                |--- migration.sql
            |--- migration_lock.toml 
        |--- adminDataSeed.ts
        |--- attendanceDataSeed.ts 
        |--- clients.ts
        |--- schema.prisma
        |--- studentDataSeed.ts
    |--- src/
        |--- functions/ 
             |--- attendance/
             |--- auth/
             |--- face/
             |--- guest/
             |--- student/
             |--- user/ 
             |--- violation/ 
        |--- tests/ 
             |--- attendance/ 
             |--- auth/ 
             |--- student/ 
        |--- utils/ 
             |--- enums/
             |--- errors/
             |--- misc/
             |--- schemas/ 
                 |--- attendance/
                 |--- auth/
                 |--- face/
                 |--- guest/
                 |--- student/
                 |--- user/ 
                 |--- violation/
             |--- types/ 
             |--- reqHandler.ts
        |--- index.ts
        |--- uploads/
             |--- .gitignore 
         
