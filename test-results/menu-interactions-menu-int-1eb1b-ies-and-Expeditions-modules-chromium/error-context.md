# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: menu-interactions.spec.ts >> menu interaction audit >> Ruins tactical support cells route to Bounties and Expeditions modules
- Location: tests\e2e\menu-interactions.spec.ts:151:3

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: apiRequestContext._wrapApiCall: ENOENT: no such file or directory, open 'C:\Users\abdul\Desktop\cultivation-idle\test-results\.playwright-artifacts-2\traces\92a0c23624e9334a8777-9dfd107814855aa1c9f4.trace'
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - img
  - generic [ref=e3]:
    - generic [ref=e7]:
      - region "Cultivation identity" [ref=e8]:
        - generic [ref=e9]:
          - img [ref=e11]
          - generic [ref=e14]:
            - generic [ref=e15]: Realm
            - strong [ref=e16]: Qi Condensation
            - generic [ref=e17]: Stage 1
        - generic [ref=e18]:
          - img [ref=e20]
          - generic [ref=e23]:
            - generic [ref=e24]: Qi
            - strong [ref=e25]: 3.2K
        - 'generic "Base 51.9 / s. Breath Balanced. Buffs: No active cultivation tonics." [ref=e26]':
          - img [ref=e28]
          - generic [ref=e31]:
            - generic [ref=e32]: Cultivation Rate
            - strong [ref=e33]: 51.9 / s
        - generic [ref=e34]:
          - img [ref=e36]
          - generic [ref=e39]:
            - generic [ref=e40]: Stability
            - strong [ref=e41]: 0%
        - generic [ref=e42]:
          - img [ref=e44]
          - generic [ref=e47]:
            - generic [ref=e48]: Foreground
            - strong [ref=e49]: Idle
      - complementary "Cultivation milestone seals" [ref=e50]:
        - button "Next Milestone Breakthrough" [ref=e52] [cursor=pointer]:
          - img [ref=e54]
          - generic [ref=e57]:
            - generic [ref=e58]: Next Milestone
            - strong [ref=e59]: Breakthrough
        - button "Need Qi Cap 100" [ref=e61] [cursor=pointer]:
          - img [ref=e63]
          - generic [ref=e66]:
            - generic [ref=e67]: Need
            - strong [ref=e68]: Qi Cap
            - generic [ref=e69]: "100"
        - button "Action Break Through" [ref=e71] [cursor=pointer]:
          - img [ref=e73]
          - generic [ref=e76]:
            - generic [ref=e77]: Action
            - strong [ref=e78]: Break Through
      - main "Dantian altar" [ref=e80]:
        - generic:
          - img
          - generic:
            - generic:
              - img
          - 'generic "Lotus state: Breakthrough Ready"':
            - generic: Breakthrough Ready
      - complementary "Doctrine seals" [ref=e81]:
        - button "Open Dao Heart" [ref=e82] [cursor=pointer]:
          - generic [ref=e84]: Dao
        - button "Path No Path selected" [ref=e86] [cursor=pointer]:
          - img [ref=e88]
          - generic [ref=e91]:
            - generic [ref=e92]: Path
            - strong [ref=e93]: No Path selected
        - button "Spirit Root Metal / Mortal" [ref=e95] [cursor=pointer]:
          - img [ref=e97]
          - generic [ref=e99]:
            - generic [ref=e100]: Spirit Root
            - strong [ref=e101]: Metal / Mortal
        - button "Heart Law No Heart Law selected" [ref=e103] [cursor=pointer]:
          - img [ref=e105]
          - generic [ref=e108]:
            - generic [ref=e109]: Heart Law
            - strong [ref=e110]: No Heart Law selected
        - button "Verse Chapter 1" [ref=e112] [cursor=pointer]:
          - img [ref=e114]
          - generic [ref=e117]:
            - generic [ref=e118]: Verse
            - strong [ref=e119]: Chapter 1
        - button "Breath / Focus Balanced" [ref=e121] [cursor=pointer]:
          - img [ref=e123]
          - generic [ref=e126]:
            - generic [ref=e127]: Breath / Focus
            - strong [ref=e128]: Balanced
      - generic:
        - generic [ref=e130]:
          - generic [ref=e131]: Breakthrough
          - strong [ref=e132]: Ready
        - region "Breakthrough Readiness" [ref=e133]:
          - generic [ref=e134]: Breakthrough Readiness
          - strong [ref=e135]: Qi and gate requirements are ready.
          - list [ref=e136]:
            - listitem [ref=e137]:
              - generic [ref=e138]: Qi
              - strong [ref=e139]: Ready
            - listitem [ref=e140]:
              - generic [ref=e141]: Realm edge
              - strong [ref=e142]: Reached
            - listitem [ref=e143]:
              - generic [ref=e144]: Gate item
              - strong [ref=e145]: Not needed now
        - region "Qi 3.2K / 100" [ref=e146]:
          - img
          - generic [ref=e152]: Qi 3.2K / 100
          - generic [ref=e153]: +51.9/s
        - region "Cultivation commands" [ref=e154]:
          - button "Break Through" [ref=e155] [cursor=pointer]:
            - generic [ref=e156]: Break Through
          - button "Start Cultivation" [ref=e157] [cursor=pointer]:
            - generic [ref=e158]: Start Cultivation
    - navigation "Primary navigation" [ref=e159]:
      - generic [ref=e160]:
        - button "Status" [ref=e161]:
          - img [ref=e164]
          - generic [ref=e165]: Status
        - button "Cultivation" [ref=e166]:
          - img [ref=e169]
          - generic [ref=e171]: Cultivation
        - button "World" [ref=e172]:
          - img [ref=e175]
          - generic [ref=e176]: World
        - button "Inventory" [ref=e177]:
          - img [ref=e180]
          - generic [ref=e181]: Inventory
        - button "Techniques" [ref=e182]:
          - img [ref=e185]
          - generic [ref=e186]: Techniques
        - button "Records" [ref=e187]:
          - img [ref=e190]
          - generic [ref=e191]: Records
        - button "Prestige" [ref=e192]:
          - img [ref=e195]
          - generic [ref=e196]: Prestige
        - button "Settings" [ref=e197]:
          - img [ref=e200]
          - generic [ref=e205]: Settings
    - dialog "Opening story" [ref=e206]:
      - paragraph [ref=e209]: A blank name cannot climb. Choose the first stroke of your Dao.
      - generic "Story controls":
        - button "Skip" [ref=e210] [cursor=pointer]
        - button "Choose Path" [active] [ref=e211] [cursor=pointer]
```