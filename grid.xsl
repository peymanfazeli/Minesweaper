<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html"/>
  <xsl:template match="/">
	<html>
      <head>
        	<title>Minesweeper</title>
      </head>
      <body>
	  	<div class="grid">
			<xsl:for-each select="grid/row">
			<xsl:value-of select="row"><span>Row</span></xsl:value-of>
				<xsl:for-each select="col">
					<xsl:choose>
						<xsl:when test="@mine = 'true'">
							<span class="gCell" data-value="mine"></span>
						</xsl:when>
						<xsl:otherwise>
							<span class="gCell"></span>
						</xsl:otherwise>
					</xsl:choose>
				</xsl:for-each>
			</xsl:for-each>
		</div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet> 
