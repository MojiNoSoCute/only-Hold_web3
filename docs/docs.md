# OnlyHold — เอกสารประกอบโปรเจกต์

> แพลตฟอร์มครีเอเตอร์บน Web3 ที่ใช้ Blockchain และ Smart Contract เป็นแกนกลาง

---

## 1. ที่มาและแรงบันดาลใจ

OnlyHold ได้รับแรงบันดาลใจจากแพลตฟอร์ม Creator Monetization เช่น OnlyFans, Patreon และ Substack แต่แก้ปัญหาหลักที่แพลตฟอร์มเหล่านั้นมี ได้แก่

| ปัญหาของแพลตฟอร์มเดิม | วิธีแก้ของ OnlyHold |
|---|---|
| แพลตฟอร์มสามารถระงับบัญชีและล็อกเงินครีเอเตอร์ได้ทันที | Smart Contract จ่ายเงินโดยตรงไม่ผ่านตัวกลาง |
| ค่าธรรมเนียมสูง 20–30% | Platform fee คงที่ 5% เท่านั้น |
| ไม่มีความโปร่งใสในรายได้ | ทุก transaction บันทึกบน Blockchain สาธารณะ |
| Subscription ไม่สามารถซื้อขายได้ | NFT Membership ซื้อขายได้บน Marketplace |

**แรงบันดาลใจด้านเทคนิค:** ERC-721 Membership NFT ของ NounsDAO, Streaming Payment ของ Sablier Protocol และ Creator Economy ของ Mirror.xyz

---

## 2. สถาปัตยกรรมระบบ

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (Next.js)                 │
│   React 19 · TypeScript · Tailwind v4 · RainbowKit  │
└──────────────────────┬──────────────────────────────┘
                       │ ethers.js v6
┌──────────────────────▼──────────────────────────────┐
│              Sepolia Testnet (Blockchain)             │
│                                                     │
│  ┌─────────────────┐   deploy   ┌────────────────┐  │
│  │ OnlyHoldFactory │──────────▶│ OnlyHoldNFT    │  │
│  │  (Registry)     │            │ (per creator)  │  │
│  │                 │──────────▶│ OnlyHoldSub... │  │
│  └─────────────────┘            └────────────────┘  │
│           │                                         │
│  ┌────────▼────────┐                                │
│  │   MockUSDC      │  (Sepolia testnet only)        │
│  │  (ERC-20)       │                                │
│  └─────────────────┘                                │
└─────────────────────────────────────────────────────┘
```

---

## 3. Functional Requirements

### FR-01 การลงทะเบียนครีเอเตอร์
ระบบต้องอนุญาตให้ผู้ใช้ที่เชื่อมต่อ Wallet ลงทะเบียนเป็นครีเอเตอร์ได้ โดยกรอกชื่อ, username (ตัวอักษร a-z, 0-9, _ เท่านั้น ไม่เกิน 30 ตัว), หมวดหมู่, ราคา NFT (ETH) และราคา Subscription รายเดือน (USDC)

### FR-02 การ Deploy Smart Contract อัตโนมัติ
เมื่อครีเอเตอร์กด "เปิดตัวโปรไฟล์" ระบบต้องเรียก `OnlyHoldFactory.launchCreator()` บน Sepolia Testnet เพื่อ Deploy สัญญา `OnlyHoldNFT` และ `OnlyHoldSubscription` ของครีเอเตอร์นั้นโดยอัตโนมัติใน Transaction เดียว

### FR-03 การ Mint NFT Membership
ระบบต้องอนุญาตให้แฟนคลับ Mint NFT สมาชิกของครีเอเตอร์ได้โดยจ่าย ETH ตามราคาที่กำหนด รายได้จะถูกแบ่งอัตโนมัติ 95% ไปที่ครีเอเตอร์ และ 5% ไปที่ treasury ของแพลตฟอร์ม

### FR-04 การสมัคร Stablecoin Subscription
ระบบต้องอนุญาตให้แฟนคลับฝาก Mock USDC เป็นจำนวนทวีคูณของราคารายเดือน (เช่น 1, 3, 6, 12 เดือน) เพื่อรับสิทธิ์เข้าถึงคอนเทนต์พิเศษตามระยะเวลาที่ฝาก

### FR-05 การยกเลิก Subscription และรับเงินคืน
ระบบต้องอนุญาตให้แฟนคลับยกเลิก Subscription และรับเงิน USDC คืนสำหรับเดือนที่เหลือทั้งหมด (คืนเป็นหน่วยเดือน ปัดลง) โดยไม่ต้องรอการอนุมัติจากครีเอเตอร์

### FR-06 การตรวจสอบสิทธิ์การเข้าถึงคอนเทนต์
ระบบต้องตรวจสอบสิทธิ์การเข้าถึงคอนเทนต์พิเศษผ่าน `OnlyHoldFactory.checkAccess()` โดยตรวจว่าผู้ใช้ถือ NFT ของครีเอเตอร์นั้น หรือมี Subscription ที่ยังไม่หมดอายุ

### FR-07 การถอนรายได้ของครีเอเตอร์
ระบบต้องอนุญาตให้ครีเอเตอร์ถอนรายได้สะสมจาก Subscription ได้ผ่านหน้า Dashboard โดยเรียก `withdrawEarnings()` บน Subscription Contract โดยตรง

### FR-08 การแสดง Admin Panel
ระบบต้องแสดงเมนู Admin Panel เฉพาะกับ Wallet address ที่กำหนด (`0x2bB2A9aB6e9fe4d3C8990aD10e247C830A0b9776`) เพื่อจัดการข้อมูล Mock creators และ content ผ่าน UI โดยบันทึกลง localStorage

### FR-09 การสลับ Network อัตโนมัติ
ระบบต้องตรวจสอบ Network ปัจจุบันของ Wallet เมื่อเชื่อมต่อ หากไม่ใช่ Sepolia Testnet (Chain ID: 11155111) ระบบต้องแสดง Banner แจ้งเตือนและเสนอให้สลับ Network อัตโนมัติ

### FR-10 การแสดงโปรไฟล์ครีเอเตอร์จาก Blockchain
ระบบต้องดึงข้อมูลครีเอเตอร์จาก `OnlyHoldFactory` บน Sepolia โดยตรง รวมถึง contract addresses, ราคา NFT และราคา Subscription เพื่อแสดงในหน้า `/creator/[username]`

---

## 4. Non-Functional Requirements

| รหัส | รายการ | รายละเอียด |
|------|--------|-----------|
| NFR-01 | ความปลอดภัย | ใช้ `ReentrancyGuard` ใน Smart Contract ทุกตัวที่รับเงิน, ใช้ `SafeERC20` สำหรับ Token transfer |
| NFR-02 | ประสิทธิภาพ | Cache creator list ระดับ module เพื่อลด RPC call, ใช้ `useMemo` กัน re-render ซ้ำ |
| NFR-03 | การใช้งาน | รองรับ MetaMask และ WalletConnect, แสดงข้อความ error เป็นภาษาไทย |
| NFR-04 | ความโปร่งใส | ทุก transaction มี link ไป Sepolia Etherscan |
| NFR-05 | ความพร้อมใช้งาน | Deploy บน Vercel (Frontend) และ Sepolia Testnet (Contracts) |

---

## 5. Smart Contracts

### 5.1 OnlyHoldFactory
**Address (Sepolia):** `0x53c19a54E7A1Bf3c597eCeE1a0989e58a041B5aA`

ทำหน้าที่เป็น Registry กลางและ Deploy Contract ของครีเอเตอร์แต่ละคน

| Function | การทำงาน |
|----------|---------|
| `launchCreator(...)` | Deploy NFT + Subscription contract ของครีเอเตอร์ในคราวเดียว |
| `checkAccess(creator, fan)` | คืน `(bool, string)` ว่าแฟนคลับมีสิทธิ์เข้าถึงหรือไม่ และผ่านช่องทางใด |
| `resolveUsername(username)` | แปลง username เป็น wallet address + contract addresses |
| `isRegistered(address)` | ตรวจว่า address นี้ register เป็นครีเอเตอร์แล้วหรือยัง |

### 5.2 OnlyHoldNFT (ERC-721)
Deploy ใหม่ต่อครีเอเตอร์ 1 สัญญา

| Function | การทำงาน |
|----------|---------|
| `mint(to, tokenURI)` | Mint NFT สมาชิก จ่าย ETH ตาม `mintPrice`, แบ่งรายได้ 95/5 อัตโนมัติ |
| `isMember(account)` | ตรวจว่า address นี้ถือ NFT อยู่หรือไม่ |
| `airdrop(recipients[])` | ครีเอเตอร์แจก NFT ฟรีให้ผู้รับหลายคน |
| `setPaused(bool)` | หยุด/เปิด Minting ชั่วคราว |

### 5.3 OnlyHoldSubscription
Deploy ใหม่ต่อครีเอเตอร์ 1 สัญญา, รับเฉพาะ Mock USDC บน Sepolia

| Function | การทำงาน |
|----------|---------|
| `subscribe(amount)` | ฝาก USDC เป็นจำนวนทวีคูณของ `monthlyPrice` |
| `withdrawBalance()` | แฟนคลับยกเลิกและรับ USDC คืนสำหรับเดือนที่เหลือ |
| `withdrawEarnings()` | ครีเอเตอร์ถอนรายได้สะสม (95% ของยอดฝากทั้งหมด) |
| `isSubscribed(account)` | ตรวจว่า Subscription ยังไม่หมดอายุ |

### 5.4 MockUSDC (ERC-20)
**Address (Sepolia):** `0x27aEbE396d987639Cd95BA0fbf02d34191dB51ee`

Stablecoin จำลองสำหรับ Sepolia Testnet มี `faucet()` function สำหรับขอรับ Token ฟรี

---

## 6. เหตุผลที่ใช้ Blockchain

### 6.1 ความไว้วางใจแบบ Trustless
ระบบ Subscription และการจ่ายเงินทำงานผ่าน Smart Contract ที่ Code อยู่บน Blockchain สาธารณะ ทั้งครีเอเตอร์และแฟนคลับสามารถตรวจสอบ Logic ได้เองโดยไม่ต้องเชื่อแพลตฟอร์ม

### 6.2 การจ่ายเงินทันที (Instant Settlement)
เมื่อ Mint NFT เงิน 95% ถึงมือครีเอเตอร์ใน Transaction เดียวกัน ไม่มี Hold Period หรือ Payout Threshold

### 6.3 NFT เป็น Membership Token
การใช้ ERC-721 มาเป็นบัตรสมาชิกทำให้สมาชิกภาพสามารถซื้อขาย โอน หรือ Stake ได้บน Secondary Market เปิดมิติเศรษฐกิจใหม่ที่ Subscription ปกติทำไม่ได้

### 6.4 ความโปร่งใสของรายได้
ยอดเงินใน Subscription Contract, Pending Earnings และ Transaction ทุกอย่างอยู่บน Blockchain สาธารณะ ตรวจสอบได้ตลอดเวลาบน Etherscan

### 6.5 ความต้านทานการเซ็นเซอร์
Creator profile และ Contract ถูก Deploy ไปบน Blockchain แล้ว ไม่สามารถ "ลบ" หรือ "ระงับ" ได้โดยฝ่ายใดฝ่ายหนึ่ง

---

## 7. Technology Stack

| Layer | Technology | เหตุผลที่เลือก |
|-------|-----------|--------------|
| Frontend Framework | Next.js 16 (App Router) | SSR, file-based routing, Vercel deployment |
| UI Language | TypeScript + React 19 | Type safety, Concurrent features |
| Styling | Tailwind CSS v4 | Utility-first, ไม่มี runtime overhead |
| Wallet Connection | ethers.js v6 + MetaMask | ควบคุม Low-level ได้มากกว่า wagmi |
| Smart Contract | Solidity 0.8.28 | Stable, รองรับ custom errors |
| Contract Framework | Hardhat + TypeChain | TypeScript integration, testing |
| Contract Library | OpenZeppelin v5 | Audited, battle-tested ERC-721/ERC-20 |
| Testnet | Ethereum Sepolia | Official Ethereum testnet ที่ยังใช้งานอยู่ |
| Frontend Hosting | Vercel | Auto-deploy from GitHub, Edge Network |

---

## 8. การปรับปรุงจากแนวคิดเดิม

| จุดที่ปรับปรุง | แนวคิดเดิม | สิ่งที่แก้ไข |
|--------------|----------|------------|
| ABI ของ `launchCreator` | ใช้ Tuple Struct `(bool, string, ...)` | เปลี่ยนเป็น flat 11 params ตรงกับ Contract จริง |
| การ detect Wallet Network | Reload หน้าเมื่อเปลี่ยน chain | อัปเดต state และแสดง Banner แทน |
| Mock Data | Hardcode ใน `mockData.ts` | Admin Panel จัดการผ่าน UI บันทึกใน localStorage |
| Creator Page 404 | ใช้เฉพาะ MOCK_CREATORS | ดึงจาก chain โดยตรงผ่าน `resolveUsername()` |
| Error Messages | แสดง Raw Error จาก ethers | `parseContractError()` แปลเป็น Error name ที่อ่านได้ |
| Feed Flickering | `creators` array สร้างใหม่ทุก render | ใช้ `useMemo` ใน `useChainData` |
| Access Check Loop | `useEffect` depend on `creators` array | Depend on `creators.length` + fetch key guard |

---

## 9. วิธีการ Deploy

### Contracts (Remix IDE)
```
1. Deploy MockUSDC.sol       → บันทึก address
2. Deploy OnlyHoldFactory.sol
   - _treasury:              0x2bB2A9aB6e9fe4d3C8990aD10e247C830A0b9776
   - _defaultStablecoin:     MockUSDC address
   - _defaultStablecoinDecimals: 6
   → บันทึก Factory address
```

### Frontend (Vercel)
```
Environment Variables:
  NEXT_PUBLIC_FACTORY_ADDRESS = <Factory address>
  NEXT_PUBLIC_USDC_ADDRESS    = <MockUSDC address>
  NEXT_PUBLIC_CHAIN_ID        = 11155111
```

---

## 10. Contract Addresses (Sepolia Testnet)

| Contract | Address |
|---------|---------|
| OnlyHoldFactory | `0x53c19a54E7A1Bf3c597eCeE1a0989e58a041B5aA` |
| MockUSDC | `0x27aEbE396d987639Cd95BA0fbf02d34191dB51ee` |
| Admin Wallet | `0x2bB2A9aB6e9fe4d3C8990aD10e247C830A0b9776` |

Etherscan: [sepolia.etherscan.io](https://sepolia.etherscan.io)

---

*เอกสารนี้สร้างขึ้นสำหรับโปรเจกต์ OnlyHold — Web3 Creator Platform*
