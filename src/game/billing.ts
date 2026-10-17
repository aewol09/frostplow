/**
 * Native Google Play In-App Purchase Service for FrostPlow:
 * Uses @capgo/native-purchases for official Android Google Play Billing Client integration.
 */

import { Capacitor } from '@capacitor/core';
import { NativePurchases, PURCHASE_TYPE, type Transaction, type Product } from '@capgo/native-purchases';
import { IAP_PRODUCTS } from './monetization.ts';

export interface PurchaseResult {
  success: boolean;
  cancelled?: boolean;
  error?: string;
  transaction?: Transaction;
}

export class BillingService {
  private static instance: BillingService | null = null;
  private isNative: boolean = false;
  private isInitialized: boolean = false;
  private isBillingAvailable: boolean = false;
  private productsMap: Map<string, Product> = new Map();

  constructor() {
    this.isNative = Capacitor.isNativePlatform();
    this.init();
  }

  public static getInstance(): BillingService {
    if (!BillingService.instance) {
      BillingService.instance = new BillingService();
    }
    return BillingService.instance;
  }

  public async init(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;

    if (!this.isNative) {
      console.log('[BillingService] Web/Browser 환경: 모의 결제(Simulation) 모드로 동작합니다.');
      return;
    }

    try {
      const supportRes = await NativePurchases.isBillingSupported();
      const isBillingSupported = !!(supportRes && supportRes.isBillingSupported);
      this.isBillingAvailable = isBillingSupported;
      console.log('[BillingService] Google Play Billing 지원 여부:', isBillingSupported);

      if (isBillingSupported) {
        const productIds = IAP_PRODUCTS.map((p) => p.id);
        try {
          const res = await NativePurchases.getProducts({
            productIdentifiers: productIds,
            productType: PURCHASE_TYPE.INAPP,
          });
          if (res && res.products) {
            res.products.forEach((p) => {
              this.productsMap.set(p.identifier, p);
            });
            console.log('[BillingService] Google Play 인앱 상품 조회 완료:', res.products.length, '개');
          }
        } catch (prodErr) {
          console.warn('[BillingService] Google Play 상품 조회 대기 (Play Console 상품 등록 또는 네트워크 확인 필요):', prodErr);
        }
      }
    } catch (err) {
      console.warn('[BillingService] Google Play Billing 초기화 실패:', err);
    }
  }

  public isSupported(): boolean {
    return this.isNative ? this.isBillingAvailable : false;
  }

  public isNativePlatform(): boolean {
    return this.isNative;
  }

  public getProduct(productId: string): Product | undefined {
    return this.productsMap.get(productId);
  }

  /**
   * Google Play 실제 인앱 결제 요청
   */
  public async purchaseProduct(productId: string): Promise<PurchaseResult> {
    if (!this.isNative) {
      console.log('[BillingService] Web 개발 환경 모의 결제 완료:', productId);
      return { success: true };
    }

    try {
      console.log(`[BillingService] Google Play 결제창 호출 시도: ${productId}`);
      // 영구 광고 제거(frostplow.noads)는 비소모성(false), 그 외 코인/패키지는 소모성(true)
      const isConsumable = productId !== 'frostplow.noads';

      const transaction = await NativePurchases.purchaseProduct({
        productIdentifier: productId,
        productType: PURCHASE_TYPE.INAPP,
        isConsumable: isConsumable,
        autoAcknowledgePurchases: true,
      });

      console.log('[BillingService] Google Play 결제 승인 완료:', transaction);
      return {
        success: true,
        transaction,
      };
    } catch (error: any) {
      console.error('[BillingService] 결제 처리 오류:', error);
      const msg = error?.message || String(error);

      // 사용자 결제 취소
      if (
        msg.includes('USER_CANCELED') ||
        msg.includes('canceled') ||
        msg.includes('cancelled') ||
        msg.includes('User canceled')
      ) {
        return {
          success: false,
          cancelled: true,
          error: '결제를 취소하셨습니다.',
        };
      }

      // 이미 소유한 비소모성 상품 (광고 제거 등)
      if (msg.includes('ITEM_ALREADY_OWNED') || msg.includes('already owned')) {
        return {
          success: true,
          error: '이미 보유 중인 상품입니다.',
        };
      }

      // Play Console에 아직 상품이 등록/활성화되지 않았거나 테스터 계정이 아닌 경우
      if (
        msg.includes('ITEM_UNAVAILABLE') ||
        msg.includes('not available') ||
        msg.includes('Billing is not') ||
        msg.includes('SERVICE_UNAVAILABLE') ||
        msg.includes('DEVELOPER_ERROR')
      ) {
        return {
          success: false,
          error: 'Google Play 스토어 상품 정보를 불러올 수 없습니다. Google Play Console에 앱 번들(AAB) 업로드 후 인앱 상품(SKU)이 활성화되어 있는지 확인해 주세요.',
        };
      }

      return {
        success: false,
        error: msg || '결제 처리에 실패했습니다.',
      };
    }
  }

  /**
   * 구매 내역 복원 (Google Play 영수증 확인)
   */
  public async restorePurchases(): Promise<{ restoredNoAds: boolean; restoredStarter: boolean; message: string }> {
    if (!this.isNative) {
      return { restoredNoAds: false, restoredStarter: false, message: '모바일 기기에서만 구매 내역 복원이 가능합니다.' };
    }

    try {
      console.log('[BillingService] 구매 복원 조회 시작...');
      const res = await NativePurchases.getPurchases({
        productType: PURCHASE_TYPE.INAPP,
      });

      let restoredNoAds = false;
      let restoredStarter = false;

      if (res && res.purchases && res.purchases.length > 0) {
        for (const tx of res.purchases) {
          const prodId = tx.productIdentifier;
          console.log('[BillingService] 보유 중인 구매 항목 감지:', prodId);
          if (prodId === 'frostplow.noads') {
            restoredNoAds = true;
          }
          if (prodId === 'frostplow.starter') {
            restoredStarter = true;
          }
        }
      }

      const hasRestored = restoredNoAds || restoredStarter;
      return {
        restoredNoAds,
        restoredStarter,
        message: hasRestored
          ? '구매 내역이 정상적으로 복원되었습니다.'
          : '복원할 수 있는 구매 내역이 없습니다.',
      };
    } catch (err: any) {
      console.warn('[BillingService] 구매 복원 실패:', err);
      return {
        restoredNoAds: false,
        restoredStarter: false,
        message: '구매 복원 중 오류가 발생했습니다: ' + (err?.message || err),
      };
    }
  }
}

export const billingService = BillingService.getInstance();
