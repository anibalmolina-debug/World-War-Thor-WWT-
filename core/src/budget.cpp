#include "wwt/budget.hpp"
#include "wwt/order.hpp"
#include "wwt/constants.hpp"
#include <algorithm>
#include <cstring>

namespace wwt {

int unitIndex(const char* code) {
  if (!code) return -1;
  for (int i = 0; i < kUnitCount; ++i) {
    if (std::strcmp(kUnitCode[i], code) == 0) return i;
  }
  return -1;
}

int resourceIndex(const char* name) {
  if (!name) return -1;
  for (int i = 0; i < kResourceCount; ++i) {
    if (std::strcmp(kResourceName[i], name) == 0) return i;
  }
  return -1;
}

int developIc(const NationView& nation, int resourceIdx) {
  if (resourceIdx < 0 || resourceIdx >= kResourceCount) return -1;
  const int idx = nation.resourceIndex[resourceIdx];
  if (idx < 0) {
    return nation.depositsMatch[resourceIdx] ? kDevelopCheap : -1;
  }
  if (idx >= 4) return -1;
  return idx <= kCheapUpToIndex ? kDevelopCheap : kDevelopExpensive;
}

static int effectiveLevel(int current, const Order& order, const char* branch) {
  if (order.researchBranch == branch && order.researchTo == current + 1) return order.researchTo;
  return current;
}

Budget budgetOf(const NationView& nation, const Order& order) {
  Budget b;
  b.ic.max = nation.ic;
  b.nt.max = nation.treasuryM;
  b.mp.max = nation.manpower;

  for (int i = 0; i < kUnitCount; ++i) {
    const int n = order.builds[i];
    if (n <= 0) continue;
    b.ic.used += kUnitIc[i] * n;
    b.mp.used += kUnitMp[i] * n;
  }
  if (order.fortification > 0) b.ic.used += kFortIc * order.fortification;
  if (!order.researchBranch.empty()) b.ic.used += kResearchIc;
  if (order.stabilityInitiatives > 0) b.ic.used += kStabilityIc * order.stabilityInitiatives;
  if (order.factoryBuild > 0) b.ic.used += kFactoryIc * order.factoryBuild;
  if (order.relocateFactories > 0) b.ic.used += kRelocateIc * order.relocateFactories;
  if (!order.developResource.empty()) {
    const int cost = developIc(nation, resourceIndex(order.developResource.c_str()));
    if (cost > 0) b.ic.used += cost;
  }
  if (order.espionageActions > 0) b.ic.used += kEspionageIc * order.espionageActions;
  if (order.warBonds > 0) b.nt.used += kWarBondsNt * order.warBonds;
  if (order.politicalCampaignNt > 0) b.nt.used += order.politicalCampaignNt;
  if (order.otherNt > 0) b.nt.used += order.otherNt;
  if (order.proxyFunding > 0) b.nt.used += order.proxyFunding;
  if (order.volunteers > 0) b.nt.used += kVolunteersNt;
  if (order.diplomacySpend > 0) b.nt.used += kDiplomacyNt * order.diplomacySpend;
  return b;
}

Validation validateOrder(const NationView& nation, const Order& order, bool locked) {
  Validation v;
  v.meters = budgetOf(nation, order);
  auto err = [&] { v.errorCount += 1; };
  auto warn = [&] { v.warningCount += 1; };

  if (locked) err();
  if (v.meters.ic.remaining() < 0) err();
  if (v.meters.nt.remaining() < 0) err();
  if (v.meters.mp.remaining() < 0) err();
  if (order.stabilityInitiatives > kStabilityMaxPerSeason) err();
  if (nation.stability + order.stabilityInitiatives > kStabilityMax) err();
  if (order.warBonds > kWarBondsMax) err();
  if (order.politicalCampaignNt > kCampaignMax) err();
  if (order.politicalCampaignNt % kCampaignStep != 0) err();
  if (order.proxyFunding != 0 &&
      (order.proxyFunding < kProxyMin || order.proxyFunding > kProxyMax)) {
    err();
  }
  if (order.fortification > 0 && order.fortificationBorder.empty()) err();
  if (!order.developResource.empty() &&
      developIc(nation, resourceIndex(order.developResource.c_str())) < 0) {
    err();
  }
  if (order.relocateFactories > nation.factoryCount) err();
  if (!order.researchBranch.empty()) {
    if (order.researchTo < 1 || order.researchTo > kResearchMax) err();
  } else if (order.researchTo) {
    err();
  }
  const int intel = effectiveLevel(nation.researchIntel, order, "intel");
  int unlocked = 0;
  for (int lv : kEspionageUnlock) {
    if (intel >= lv) unlocked += 1;
  }
  if (order.espionageActions > kEspionageMax) err();
  if (order.espionageActions > unlocked) err();
  if (order.builds[kAbdIndex] > 0) {
    const int air = effectiveLevel(nation.researchAir, order, "air");
    if (air < kAirborneAirRd) err();
    if (!order.hasBomberWing && order.builds[kBwIndex] <= 0) err();
  }
  int unitIc = 0;
  for (int i = 0; i < kUnitCount; ++i) {
    unitIc += kUnitIc[i] * order.builds[i];
    if (kUnitHeavy[i] && order.builds[i] > 0) warn();
  }
  if (nation.ic > 0 && unitIc * 100 > nation.ic * nation.militaryCapPct) err();
  if (v.meters.ic.used * 10 >= v.meters.ic.max * 8 && v.meters.ic.remaining() >= 0) warn();
  v.ok = v.errorCount == 0;
  return v;
}

}
