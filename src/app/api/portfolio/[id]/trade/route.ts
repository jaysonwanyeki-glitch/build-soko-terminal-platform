import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { portfolios, holdings, transactions, stocks, bonds } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const portfolioId = parseInt(id);
    const body = await req.json();
    const {
      type, // BUY | SELL
      assetType, // STOCK | BOND
      assetSymbol,
      quantity,
      price,
      fees = 0,
    } = body;

    if (!type || !assetType || !assetSymbol || !quantity || !price) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const totalAmount = quantity * price;
    const totalWithFees =
      type === "BUY" ? totalAmount + fees : totalAmount - fees;

    // Get portfolio
    const [portfolio] = await db
      .select()
      .from(portfolios)
      .where(eq(portfolios.id, portfolioId))
      .limit(1);

    if (!portfolio) {
      return NextResponse.json(
        { error: "Portfolio not found" },
        { status: 404 }
      );
    }

    // Validate cash for BUY
    if (type === "BUY" && portfolio.cashBalance < totalWithFees) {
      return NextResponse.json(
        { error: "Insufficient cash balance" },
        { status: 400 }
      );
    }

    // Validate holdings for SELL
    if (type === "SELL") {
      const [holding] = await db
        .select()
        .from(holdings)
        .where(
          and(
            eq(holdings.portfolioId, portfolioId),
            eq(holdings.assetType, assetType),
            eq(holdings.assetSymbol, assetSymbol)
          )
        )
        .limit(1);

      if (!holding || holding.quantity < quantity) {
        return NextResponse.json(
          { error: "Insufficient holdings" },
          { status: 400 }
        );
      }
    }

    // Insert transaction
    await db.insert(transactions).values({
      portfolioId,
      type,
      assetType,
      assetSymbol,
      quantity,
      price,
      totalAmount: totalWithFees,
      fees,
      notes: `${type} ${quantity} ${assetSymbol} @ ${price}`,
      executedAt: new Date(),
    });

    // Update holdings
    const [existingHolding] = await db
      .select()
      .from(holdings)
      .where(
        and(
          eq(holdings.portfolioId, portfolioId),
          eq(holdings.assetType, assetType),
          eq(holdings.assetSymbol, assetSymbol)
        )
      )
      .limit(1);

    if (type === "BUY") {
      if (existingHolding) {
        const newQty = existingHolding.quantity + quantity;
        const newTotalCost = existingHolding.totalCost + totalAmount;
        const newAvgCost = newTotalCost / newQty;
        await db
          .update(holdings)
          .set({
            quantity: newQty,
            avgCost: newAvgCost,
            totalCost: newTotalCost,
            currentPrice: price,
            currentValue: newQty * price,
            unrealizedPL: newQty * price - newTotalCost,
            unrealizedPLPercent:
              ((newQty * price - newTotalCost) / newTotalCost) * 100,
          })
          .where(eq(holdings.id, existingHolding.id));
      } else {
        await db.insert(holdings).values({
          portfolioId,
          assetType,
          assetSymbol,
          quantity,
          avgCost: price,
          totalCost: totalAmount,
          currentPrice: price,
          currentValue: totalAmount,
          unrealizedPL: 0,
          unrealizedPLPercent: 0,
          dayChange: 0,
        });
      }
      // Update cash
      await db
        .update(portfolios)
        .set({ cashBalance: portfolio.cashBalance - totalWithFees })
        .where(eq(portfolios.id, portfolioId));
    } else {
      // SELL
      if (existingHolding) {
        const newQty = existingHolding.quantity - quantity;
        if (newQty <= 0.0001) {
          await db.delete(holdings).where(eq(holdings.id, existingHolding.id));
        } else {
          const newTotalCost =
            existingHolding.totalCost -
            existingHolding.avgCost * quantity;
          await db
            .update(holdings)
            .set({
              quantity: newQty,
              totalCost: newTotalCost,
              currentPrice: price,
              currentValue: newQty * price,
              unrealizedPL: newQty * price - newTotalCost,
              unrealizedPLPercent:
                newTotalCost > 0
                  ? ((newQty * price - newTotalCost) / newTotalCost) * 100
                  : 0,
            })
            .where(eq(holdings.id, existingHolding.id));
        }
      }
      // Update cash
      await db
        .update(portfolios)
        .set({ cashBalance: portfolio.cashBalance + totalWithFees })
        .where(eq(portfolios.id, portfolioId));
    }

    // Recalculate portfolio totals
    const allHoldings = await db
      .select()
      .from(holdings)
      .where(eq(holdings.portfolioId, portfolioId));

    const [updatedPortfolio] = await db
      .select()
      .from(portfolios)
      .where(eq(portfolios.id, portfolioId))
      .limit(1);

    const totalCurrentValue =
      (updatedPortfolio?.cashBalance ?? 0) +
      allHoldings.reduce((sum, h) => sum + (h.currentValue ?? 0), 0);

    const totalInvested = allHoldings.reduce(
      (sum, h) => sum + (h.totalCost ?? 0),
      0
    );

    const totalReturn = totalCurrentValue - totalInvested - (updatedPortfolio?.cashBalance ?? 0) +
      (allHoldings.reduce((sum, h) => sum + (h.totalCost ?? 0), 0));

    // Simpler: totalReturn = current portfolio value - (total invested + initial cash)
    const totalPortfolioInvested = allHoldings.reduce(
      (sum, h) => sum + (h.totalCost ?? 0),
      0
    );

    const totalPortfolioValue =
      (updatedPortfolio?.cashBalance ?? 0) +
      allHoldings.reduce((sum, h) => sum + (h.currentValue ?? 0), 0);

    const totalPL = totalPortfolioValue - totalPortfolioInvested;

    await db
      .update(portfolios)
      .set({
        totalInvested: totalPortfolioInvested,
        totalCurrentValue: totalPortfolioValue,
        totalReturn: totalPL,
        totalReturnPercent:
          totalPortfolioInvested > 0
            ? (totalPL / totalPortfolioInvested) * 100
            : 0,
      })
      .where(eq(portfolios.id, portfolioId));

    const [finalPortfolio] = await db
      .select()
      .from(portfolios)
      .where(eq(portfolios.id, portfolioId))
      .limit(1);

    return NextResponse.json({ data: finalPortfolio }, { status: 201 });
  } catch (error) {
    console.error("Trade error:", error);
    return NextResponse.json(
      { error: "Failed to execute trade" },
      { status: 500 }
    );
  }
}
