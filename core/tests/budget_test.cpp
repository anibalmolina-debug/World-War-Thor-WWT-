#include "wwt/budget.hpp"
#include "wwt/version.hpp"

#include <cstdio>
#include <cstdlib>
#include <cstring>

static int fails = 0;

static void expect(bool ok, const char* msg) {
  if (!ok) {
    std::fprintf(stderr, "FAIL: %s\n", msg);
    ++fails;
  }
}

int main() {
  expect(std::strcmp(wwt::kCoreVersion, "0.2.0") == 0, "version");

  wwt::NationView ger;
  ger.ic = 14;
  ger.treasuryM = 300;
  ger.manpower = 25;
  ger.stability = 8;
  ger.militaryCapPct = 100;
  ger.factoryCount = 6;
  ger.researchAir = 2;
  ger.researchIntel = 0;
  ger.resourceIndex[0] = 2;
  ger.resourceIndex[1] = 3;
  ger.resourceIndex[2] = 3;
  ger.resourceIndex[3] = 1;
  ger.resourceIndex[4] = 2;

  wwt::Order o;
  o.builds[0] = 2;
  o.warBonds = 1;
  o.hasBomberWing = true;

  auto b = wwt::budgetOf(ger, o);
  expect(b.ic.used == 2, "2 ID = 2 IC");
  expect(b.mp.used == 2, "2 ID = 2 MP");
  expect(b.nt.used == 40, "1 war bond");
  expect(b.ic.remaining() == 12, "IC remaining");

  o.builds[7] = 1;
  auto v = wwt::validateOrder(ger, o);
  expect(!v.ok, "airborne blocked without air 4");

  ger.researchAir = 4;
  v = wwt::validateOrder(ger, o);
  expect(v.ok, "airborne ok with air 4 and bomber");

  o.builds[0] = 20;
  v = wwt::validateOrder(ger, o);
  expect(!v.ok, "IC overspend");
  expect(v.meters.ic.remaining() < 0, "negative remaining");

  return fails ? EXIT_FAILURE : EXIT_SUCCESS;
}
