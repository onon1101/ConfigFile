// LUT RAMs for Virtex, Virtex 2, Spartan 3, Virtex 4.
// The corresponding definition file is lutrams_xcv.txt

module $__XILINX_LUTRAM_SP_ (...);

parameter INIT = 0;
parameter OPTION_ABITS = 4;

output PORT_RW_RD_DATA;
input PORT_RW_WR_DATA;
input [OPTION_ABITS-1:0] PORT_RW_ADDR;
input PORT_RW_WR_EN;
input PORT_RW_CLK;

generate
case(OPTION_ABITS)
4: RAM16X1S
	#(
		.INIT(INIT),
	)
	_TECHMAP_REPLACE_
	(
		.A0(PORT_RW_ADDR[0]),
		.A1(PORT_RW_ADDR[1]),
		.A2(PORT_RW_ADDR[2]),
		.A3(PORT_RW_ADDR[3]),
		.D(PORT_RW_WR_DATA),
		.O(PORT_RW_RD_DATA),
		.WE(PORT_RW_WR_EN),
		.WCLK(PORT_RW_CLK),
	);
5: RAM32X1S
	#(
		.INIT(INIT),
	)
	_TECHMAP_REPLACE_
	(
		.A0(PORT_RW_ADDR[0]),
		.A1(PORT_RW_ADDR[1]),
		.A2(PORT_RW_ADDR[2]),
		.A3(PORT_RW_ADDR[3]),
		.A4(PORT_RW_ADDR[4]),
		.D(PORT_RW_WR_DATA),
		.O(PORT_RW_RD_DATA),
		.WE(PORT_RW_WR_EN),
		.WCLK(PORT_RW_CLK),
	);
6: RAM64X1S
	#(
		.INIT(INIT),
	)
	_TECHMAP_REPLACE_
	(
		.A0(PORT_RW_ADDR[0]),
		.A1(PORT_RW_ADDR[1]),
		.A2(PORT_RW_ADDR[2]),
		.A3(PORT_RW_ADDR[3]),
		.A4(PORT_RW_ADDR[4]),
		.A5(PORT_RW_ADDR[5]),
		.D(PORT_RW_WR_DATA),
		.O(PORT_RW_RD_DATA),
		.WE(PORT_RW_WR_EN),
		.WCLK(PORT_RW_CLK),
	);
7: RAM128X1S
	#(
		.INIT(INIT),
	)
	_TECHMAP_REPLACE_
	(
		.A0(PORT_RW_ADDR[0]),
		.A1(PORT_RW_ADDR[1]),
		.A2(PORT_RW_ADDR[2]),
		.A3(PORT_RW_ADDR[3]),
		.A4(PORT_RW_ADDR[4]),
		.A5(PORT_RW_ADDR[5]),
		.A6(PORT_RW_ADDR[6]),
		.D(PORT_RW_WR_DATA),
		.O(PORT_RW_RD_DATA),
		.WE(PORT_RW_WR_EN),
		.WCLK(PORT_RW_CLK),
	);
default:
	$error("invalid OPTION_ABITS");
endcase
endgenerate

endmodule

module $__XILINX_LUTRAM_DP_ (...);

parameter INIT = 0;
parameter OPTION_ABITS = 4;

output PORT_RW_RD_DATA;
input PORT_RW_WR_DATA;
input [OPTION_ABITS-1:0] PORT_RW_ADDR;
input PORT_RW_WR_EN;
input PORT_RW_CLK;

output PORT_R_RD_DATA;
input [OPTION_ABITS-1:0] PORT_R_ADDR;

generate
case (OPTION_ABITS)
4: RAM16X1D
	#(
		.INIT(INIT),
	)
	_TECHMAP_REPLACE_
	(
		.A0(PORT_RW_ADDR[0]),
		.A1(PORT_RW_ADDR[1]),
		.A2(PORT_RW_ADDR[2]),
		.A3(PORT_RW_ADDR[3]),
		.D(PORT_RW_WR_DATA),
		.SPO(PORT_RW_RD_DATA),
		.WE(PORT_RW_WR_EN),
		.WCLK(PORT_RW_CLK),
		.DPRA0(PORT_R_ADDR[0]),
		.DPRA1(PORT_R_ADDR[1]),
		.DPRA2(PORT_R_ADDR[2]),
		.DPRA3(PORT_R_ADDR[3]),
		.DPO(PORT_R_RD_DATA),
	);
5: RAM32X1D
	#(
		.INIT(INIT),
	)
	_TECHMAP_REPLACE_
	(
		.A0(PORT_RW_ADDR[0]),
		.A1(PORT_RW_ADDR[1]),
		.A2(PORT_RW_ADDR[2]),
		.A3(PORT_RW_ADDR[3]),
		.A4(PORT_RW_ADDR[4]),
		.D(PORT_RW_WR_DATA),
		.SPO(PORT_RW_RD_DATA),
		.WE(PORT_RW_WR_EN),
		.WCLK(PORT_RW_CLK),
		.DPRA0(PORT_R_ADDR[0]),
		.DPRA1(PORT_R_ADDR[1]),
		.DPRA2(PORT_R_ADDR[2]),
		.DPRA3(PORT_R_ADDR[3]),
		.DPRA4(PORT_R_ADDR[4]),
		.DPO(PORT_R_RD_DATA),
	);
6: RAM64X1D
	#(
		.INIT(INIT),
	)
	_TECHMAP_REPLACE_
	(
		.A0(PORT_RW_ADDR[0]),
		.A1(PORT_RW_ADDR[1]),
		.A2(PORT_RW_ADDR[2]),
		.A3(PORT_RW_ADDR[3]),
		.A4(PORT_RW_ADDR[4]),
		.A5(PORT_RW_ADDR[5]),
		.D(PORT_RW_WR_DATA),
		.SPO(PORT_RW_RD_DATA),
		.WE(PORT_RW_WR_EN),
		.WCLK(PORT_RW_CLK),
		.DPRA0(PORT_R_ADDR[0]),
		.DPRA1(PORT_R_ADDR[1]),
		.DPRA2(PORT_R_ADDR[2]),
		.DPRA3(PORT_R_ADDR[3]),
		.DPRA4(PORT_R_ADDR[4]),
		.DPRA5(PORT_R_ADDR[5]),
		.DPO(PORT_R_RD_DATA),
	);
default:
	$error("invalid OPTION_ABITS");
endcase
endgenerate

endmodule
